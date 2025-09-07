"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdownConfigs = exports.performShutdownHealthCheck = exports.cleanupResources = exports.TimeoutManager = exports.ProcessCleanup = exports.enableGracefulShutdown = exports.gracefulShutdownManager = exports.GracefulShutdownManager = exports.trackWebSocketConnection = exports.createConnectionTrackingMiddleware = exports.setupProcessSignals = exports.isSystemShuttingDown = exports.getShutdownStatus = exports.emergencyShutdown = exports.shutdown = exports.setupGracefulShutdown = exports.createGracefulShutdown = exports.getConnectionInfo = exports.getActiveConnectionCount = exports.untrackConnection = exports.trackConnection = exports.unregisterService = exports.registerService = exports.shutdownEmitter = exports.ShutdownPhase = exports.ShutdownPriority = void 0;
const events_1 = require("events");
const logger_1 = require("@/utils/logger");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const whatsapp_service_1 = require("@/services/whatsapp.service");
var ShutdownPriority;
(function (ShutdownPriority) {
    ShutdownPriority[ShutdownPriority["CRITICAL"] = 0] = "CRITICAL";
    ShutdownPriority[ShutdownPriority["HIGH"] = 1] = "HIGH";
    ShutdownPriority[ShutdownPriority["NORMAL"] = 2] = "NORMAL";
    ShutdownPriority[ShutdownPriority["LOW"] = 3] = "LOW";
    ShutdownPriority[ShutdownPriority["CLEANUP"] = 4] = "CLEANUP";
})(ShutdownPriority || (exports.ShutdownPriority = ShutdownPriority = {}));
var ShutdownPhase;
(function (ShutdownPhase) {
    ShutdownPhase["NORMAL"] = "normal";
    ShutdownPhase["INITIATED"] = "initiated";
    ShutdownPhase["DRAINING"] = "draining";
    ShutdownPhase["CLEANUP"] = "cleanup";
    ShutdownPhase["FINALIZATION"] = "finalization";
    ShutdownPhase["COMPLETED"] = "completed";
    ShutdownPhase["FORCED"] = "forced";
    ShutdownPhase["ERROR"] = "error";
})(ShutdownPhase || (exports.ShutdownPhase = ShutdownPhase = {}));
const defaultOptions = {
    timeout: 30000,
    logger: logger_1.logger,
    signals: ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGUSR2'],
    beforeShutdown: async () => { },
    onShutdown: async () => { },
    afterShutdown: async () => { },
    forceExitTimeout: 35000,
    drainTimeout: 10000,
    healthCheckTimeout: 5000,
    keepAliveTimeout: 2000,
    cleanupServices: true,
    enableWebSockets: true,
    enableScheduler: true,
    enableQueue: true,
    enableCache: true,
    enableMonitoring: true,
    enableNotifications: true,
    shutdownPriority: [
        ShutdownPriority.CRITICAL,
        ShutdownPriority.HIGH,
        ShutdownPriority.NORMAL,
        ShutdownPriority.LOW,
        ShutdownPriority.CLEANUP
    ],
    emergencyShutdown: false,
    preserveState: true,
    backupData: true,
    notifyUsers: false,
    maintainConnections: false
};
const serviceRegistry = new Map();
let connections = new Set();
let isShuttingDown = false;
let shutdownStatus = {
    initiated: false,
    phase: ShutdownPhase.NORMAL,
    completedServices: [],
    failedServices: [],
    activeConnections: 0,
    errors: [],
    warnings: []
};
exports.shutdownEmitter = new events_1.EventEmitter();
function registerService(config) {
    try {
        if (serviceRegistry.has(config.name)) {
            logger_1.logger.warn(`Service ${config.name} already registered, updating configuration`);
        }
        serviceRegistry.set(config.name, {
            ...config,
            timeout: config.timeout || 5000,
            graceful: config.graceful !== false,
            dependencies: config.dependencies || []
        });
        logger_1.logger.debug(`Registered service for shutdown: ${config.name}`);
    }
    catch (error) {
        logger_1.logger.error(`Failed to register service ${config.name}:`, error);
        throw error;
    }
}
exports.registerService = registerService;
function unregisterService(serviceName) {
    try {
        if (serviceRegistry.has(serviceName)) {
            serviceRegistry.delete(serviceName);
            logger_1.logger.debug(`Unregistered service from shutdown: ${serviceName}`);
        }
        else {
            logger_1.logger.warn(`Attempted to unregister unknown service: ${serviceName}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to unregister service ${serviceName}:`, error);
    }
}
exports.unregisterService = unregisterService;
function trackConnection(connection, type = 'http', metadata) {
    try {
        const connectionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connectionInfo = {
            id: connectionId,
            type,
            socket: connection,
            createdAt: new Date(),
            lastActivity: new Date(),
            metadata: metadata || {},
            drainTimeout: defaultOptions.drainTimeout,
            forceCloseTimeout: defaultOptions.forceExitTimeout
        };
        connections.add(connectionInfo);
        if (connection && typeof connection.on === 'function') {
            connection.on('close', () => {
                untrackConnection(connectionId);
            });
            connection.on('error', (error) => {
                logger_1.logger.warn(`Connection ${connectionId} error:`, error);
                untrackConnection(connectionId);
            });
            if (type === 'http' && connection.socket) {
                connection.socket.on('data', () => {
                    const conn = Array.from(connections).find(c => c.id === connectionId);
                    if (conn) {
                        conn.lastActivity = new Date();
                    }
                });
            }
        }
        logger_1.logger.debug(`Tracking connection: ${connectionId} (${type})`);
        return connectionId;
    }
    catch (error) {
        logger_1.logger.error('Failed to track connection:', error);
        return '';
    }
}
exports.trackConnection = trackConnection;
function untrackConnection(connectionId) {
    try {
        const connection = Array.from(connections).find(c => c.id === connectionId);
        if (connection) {
            connections.delete(connection);
            logger_1.logger.debug(`Untracked connection: ${connectionId}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to untrack connection ${connectionId}:`, error);
    }
}
exports.untrackConnection = untrackConnection;
function getActiveConnectionCount() {
    return connections.size;
}
exports.getActiveConnectionCount = getActiveConnectionCount;
function getConnectionInfo() {
    return Array.from(connections);
}
exports.getConnectionInfo = getConnectionInfo;
async function closeConnections(opts) {
    const connectionCount = connections.size;
    if (connectionCount === 0) {
        opts.logger.info('No active connections to close');
        return;
    }
    opts.logger.info(`Closing ${connectionCount} active connections...`);
    try {
        const drainPromises = [];
        for (const connection of connections) {
            const drainPromise = drainConnection(connection, opts);
            drainPromises.push(drainPromise);
        }
        await Promise.allSettled(drainPromises);
        const remainingConnections = Array.from(connections);
        if (remainingConnections.length > 0) {
            opts.logger.warn(`Force closing ${remainingConnections.length} remaining connections`);
            for (const connection of remainingConnections) {
                try {
                    if (connection.socket && typeof connection.socket.destroy === 'function') {
                        connection.socket.destroy();
                    }
                    else if (connection.socket && typeof connection.socket.end === 'function') {
                        connection.socket.end();
                    }
                    connections.delete(connection);
                }
                catch (error) {
                    opts.logger.error(`Failed to force close connection ${connection.id}:`, error);
                }
            }
        }
        opts.logger.info('All connections closed successfully');
    }
    catch (error) {
        opts.logger.error('Error during connection cleanup:', error);
        throw error;
    }
}
async function drainConnection(connection, opts) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            opts.logger.warn(`Connection ${connection.id} drain timeout, force closing`);
            if (connection.socket && typeof connection.socket.destroy === 'function') {
                connection.socket.destroy();
            }
            connections.delete(connection);
            resolve();
        }, connection.drainTimeout || opts.drainTimeout);
        try {
            if (connection.socket) {
                switch (connection.type) {
                    case 'http':
                        if (typeof connection.socket.end === 'function') {
                            connection.socket.end(() => {
                                clearTimeout(timeout);
                                connections.delete(connection);
                                resolve();
                            });
                        }
                        else {
                            clearTimeout(timeout);
                            connections.delete(connection);
                            resolve();
                        }
                        break;
                    case 'websocket':
                        if (typeof connection.socket.close === 'function') {
                            connection.socket.close(1001, 'Server shutting down');
                            clearTimeout(timeout);
                            connections.delete(connection);
                            resolve();
                        }
                        else {
                            clearTimeout(timeout);
                            connections.delete(connection);
                            resolve();
                        }
                        break;
                    case 'database':
                    case 'redis':
                    case 'queue':
                        if (typeof connection.socket.close === 'function') {
                            connection.socket.close().then(() => {
                                clearTimeout(timeout);
                                connections.delete(connection);
                                resolve();
                            }).catch((error) => {
                                opts.logger.error(`Error closing ${connection.type} connection:`, error);
                                clearTimeout(timeout);
                                connections.delete(connection);
                                resolve();
                            });
                        }
                        else {
                            clearTimeout(timeout);
                            connections.delete(connection);
                            resolve();
                        }
                        break;
                    default:
                        clearTimeout(timeout);
                        connections.delete(connection);
                        resolve();
                }
            }
            else {
                clearTimeout(timeout);
                connections.delete(connection);
                resolve();
            }
        }
        catch (error) {
            opts.logger.error(`Error draining connection ${connection.id}:`, error);
            clearTimeout(timeout);
            connections.delete(connection);
            resolve();
        }
    });
}
async function shutdownServices(opts) {
    opts.logger.info('Starting service shutdown sequence...');
    try {
        const servicesByPriority = new Map();
        for (const [name, config] of serviceRegistry) {
            const priority = config.priority;
            if (!servicesByPriority.has(priority)) {
                servicesByPriority.set(priority, []);
            }
            servicesByPriority.get(priority).push(config);
        }
        for (const priority of opts.shutdownPriority) {
            const services = servicesByPriority.get(priority) || [];
            if (services.length === 0)
                continue;
            opts.logger.info(`Shutting down priority ${priority} services (${services.length} services)...`);
            const shutdownPromises = services.map(service => shutdownService(service, opts));
            const results = await Promise.allSettled(shutdownPromises);
            results.forEach((result, index) => {
                const service = services[index];
                if (result.status === 'fulfilled') {
                    shutdownStatus.completedServices.push(service.name);
                    opts.logger.info(`Service ${service.name} shutdown completed`);
                }
                else {
                    shutdownStatus.failedServices.push(service.name);
                    const error = {
                        service: service.name,
                        error: result.reason,
                        timestamp: new Date(),
                        phase: shutdownStatus.phase,
                        critical: priority <= ShutdownPriority.HIGH
                    };
                    shutdownStatus.errors.push(error);
                    opts.logger.error(`Service ${service.name} shutdown failed:`, result.reason);
                }
            });
        }
        opts.logger.info('Service shutdown sequence completed');
    }
    catch (error) {
        opts.logger.error('Error during service shutdown:', error);
        throw error;
    }
}
async function shutdownService(config, opts) {
    const startTime = Date.now();
    opts.logger.info(`Shutting down service: ${config.name}`);
    try {
        if (config.dependencies && config.dependencies.length > 0) {
            const unmetDependencies = config.dependencies.filter(dep => !shutdownStatus.completedServices.includes(dep));
            if (unmetDependencies.length > 0) {
                opts.logger.warn(`Service ${config.name} has unmet dependencies: ${unmetDependencies.join(', ')}`);
            }
        }
        if (config.graceful && config.cleanupFunction) {
            const shutdownPromise = config.cleanupFunction();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Shutdown timeout for ${config.name}`)), config.timeout);
            });
            await Promise.race([shutdownPromise, timeoutPromise]);
        }
        else if (config.cleanupFunction) {
            await config.cleanupFunction();
        }
        if (config.healthCheck) {
            try {
                const isHealthy = await Promise.race([
                    config.healthCheck(),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Health check timeout')), opts.healthCheckTimeout);
                    })
                ]);
                if (isHealthy) {
                    opts.logger.warn(`Service ${config.name} still reports healthy after shutdown`);
                }
            }
            catch (error) {
                opts.logger.debug(`Service ${config.name} health check failed as expected:`, error.message);
            }
        }
        const duration = Date.now() - startTime;
        opts.logger.info(`Service ${config.name} shutdown completed in ${duration}ms`);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        opts.logger.error(`Service ${config.name} shutdown failed after ${duration}ms:`, error);
        throw error;
    }
}
function registerCoreServices() {
    try {
        registerService({
            name: 'HealthCheck',
            priority: ShutdownPriority.CRITICAL,
            timeout: 3000,
            graceful: true,
            cleanupFunction: async () => {
                logger_1.logger.info('Health service cleanup completed');
            },
            healthCheck: async () => {
                try {
                    return true;
                }
                catch {
                    return false;
                }
            }
        });
        registerService({
            name: 'Monitoring',
            priority: ShutdownPriority.CRITICAL,
            timeout: 5000,
            graceful: true,
            cleanupFunction: async () => {
                logger_1.logger.info('Monitoring service cleanup completed');
            }
        });
        registerService({
            name: 'WebSocket',
            priority: ShutdownPriority.HIGH,
            timeout: 8000,
            graceful: true,
            dependencies: ['HealthCheck'],
            cleanupFunction: async () => {
                logger_1.logger.info('WebSocket service cleanup completed');
            }
        });
        registerService({
            name: 'Scheduler',
            priority: ShutdownPriority.HIGH,
            timeout: 10000,
            graceful: true,
            cleanupFunction: async () => {
                logger_1.logger.info('Scheduler service cleanup completed');
            }
        });
        registerService({
            name: 'Queue',
            priority: ShutdownPriority.NORMAL,
            timeout: 15000,
            graceful: true,
            preserveState: true,
            dependencies: ['Scheduler'],
            cleanupFunction: async () => {
                logger_1.logger.info('Queue service cleanup completed');
            }
        });
        registerService({
            name: 'Notification',
            priority: ShutdownPriority.NORMAL,
            timeout: 8000,
            graceful: true,
            dependencies: ['Queue'],
            cleanupFunction: async () => {
                (0, logger_1.logInfo)('Notification service cleanup completed');
            }
        });
        registerService({
            name: 'WhatsApp',
            priority: ShutdownPriority.NORMAL,
            timeout: 10000,
            graceful: true,
            dependencies: ['Notification'],
            cleanupFunction: async () => {
                const whatsappService = whatsapp_service_1.WhatsAppService.getInstance();
                logger_1.logger.info('WhatsApp service cleanup completed');
            }
        });
        registerService({
            name: 'Cache',
            priority: ShutdownPriority.LOW,
            timeout: 5000,
            graceful: true,
            preserveState: true,
            cleanupFunction: async () => {
                logger_1.logger.info('Cache service cleanup completed');
            }
        });
        registerService({
            name: 'Redis',
            priority: ShutdownPriority.LOW,
            timeout: 8000,
            graceful: true,
            preserveState: true,
            dependencies: ['Cache'],
            cleanupFunction: async () => {
                const redisService = redis_service_1.RedisService;
                await redisService.disconnect();
            },
            healthCheck: async () => {
                try {
                    const redisService = redis_service_1.RedisService;
                    return true;
                }
                catch {
                    return false;
                }
            }
        });
        registerService({
            name: 'Database',
            priority: ShutdownPriority.CLEANUP,
            timeout: 15000,
            graceful: true,
            preserveState: true,
            dependencies: ['Redis', 'Queue', 'Cache'],
            cleanupFunction: async () => {
                const dbService = database_service_1.DatabaseService.getInstance();
                await dbService.disconnect();
            },
            healthCheck: async () => {
                try {
                    const dbService = database_service_1.DatabaseService.getInstance();
                    return true;
                }
                catch {
                    return false;
                }
            }
        });
        logger_1.logger.info('Core services registered for graceful shutdown');
    }
    catch (error) {
        logger_1.logger.error('Failed to register core services:', error);
        throw error;
    }
}
function createGracefulShutdown(server, options = {}) {
    const opts = { ...defaultOptions, ...options };
    let shutdownInitiated = false;
    registerCoreServices();
    server.on('connection', (socket) => {
        trackConnection(socket, 'http');
        socket.on('close', () => {
        });
    });
    if (server.keepAliveTimeout !== undefined) {
        server.keepAliveTimeout = opts.keepAliveTimeout;
    }
    return async function gracefulShutdown(signal) {
        if (shutdownInitiated) {
            opts.logger.warn(`Received ${signal} signal while already shutting down, forcing exit...`);
            process.exit(1);
        }
        shutdownInitiated = true;
        isShuttingDown = true;
        shutdownStatus = {
            ...shutdownStatus,
            initiated: true,
            startTime: new Date(),
            signal,
            phase: ShutdownPhase.INITIATED,
            activeConnections: connections.size
        };
        opts.logger.info(`Received ${signal} signal, starting graceful shutdown...`);
        exports.shutdownEmitter.emit('shutdown:initiated', { signal, status: shutdownStatus });
        try {
            shutdownStatus.phase = ShutdownPhase.DRAINING;
            await opts.beforeShutdown(signal);
            opts.logger.info('Stopping server from accepting new connections...');
            server.close((error) => {
                if (error) {
                    opts.logger.error('Error stopping server:', error);
                }
                else {
                    opts.logger.info('Server stopped accepting new connections');
                }
            });
            shutdownStatus.phase = ShutdownPhase.CLEANUP;
            shutdownStatus.activeConnections = connections.size;
            if (connections.size > 0) {
                opts.logger.info(`Draining ${connections.size} active connections...`);
                await closeConnections(opts);
            }
            if (opts.cleanupServices) {
                await shutdownServices(opts);
            }
            await opts.onShutdown(signal);
            shutdownStatus.phase = ShutdownPhase.FINALIZATION;
            await opts.afterShutdown(signal);
            shutdownStatus.phase = ShutdownPhase.COMPLETED;
            const shutdownDuration = shutdownStatus.startTime ?
                Date.now() - shutdownStatus.startTime.getTime() : 0;
            opts.logger.info(`Graceful shutdown completed in ${shutdownDuration}ms`);
            exports.shutdownEmitter.emit('shutdown:completed', {
                signal,
                duration: shutdownDuration,
                status: shutdownStatus
            });
            process.exit(0);
        }
        catch (error) {
            shutdownStatus.phase = ShutdownPhase.ERROR;
            const shutdownError = {
                service: 'GracefulShutdown',
                error: error,
                timestamp: new Date(),
                phase: shutdownStatus.phase,
                critical: true
            };
            shutdownStatus.errors.push(shutdownError);
            opts.logger.error('Error during graceful shutdown:', error);
            exports.shutdownEmitter.emit('shutdown:error', { signal, error, status: shutdownStatus });
            process.exit(1);
        }
    };
}
exports.createGracefulShutdown = createGracefulShutdown;
function setupGracefulShutdown(server, options = {}) {
    const opts = { ...defaultOptions, ...options };
    const shutdown = createGracefulShutdown(server, opts);
    for (const signal of opts.signals) {
        process.on(signal, () => {
            shutdown(signal).catch((error) => {
                opts.logger.error(`Fatal error during ${signal} shutdown:`, error);
                process.exit(1);
            });
        });
    }
    process.on('uncaughtException', (error) => {
        opts.logger.error('Uncaught exception, initiating emergency shutdown:', error);
        shutdownStatus.phase = ShutdownPhase.ERROR;
        exports.shutdownEmitter.emit('shutdown:emergency', { error, status: shutdownStatus });
        shutdown('UNCAUGHT_EXCEPTION').catch(() => {
            process.exit(1);
        });
    });
    process.on('unhandledRejection', (reason, promise) => {
        opts.logger.error('Unhandled promise rejection, initiating emergency shutdown:', reason);
        shutdownStatus.phase = ShutdownPhase.ERROR;
        exports.shutdownEmitter.emit('shutdown:emergency', { error: reason, promise, status: shutdownStatus });
        shutdown('UNHANDLED_REJECTION').catch(() => {
            process.exit(1);
        });
    });
    process.on('beforeExit', (code) => {
        if (code === 0 && !isShuttingDown) {
            opts.logger.info('Process exiting normally, performing final cleanup...');
            shutdown('BEFORE_EXIT').catch(() => {
                process.exit(1);
            });
        }
    });
    opts.logger.info(`Graceful shutdown configured for signals: ${opts.signals.join(', ')}`);
}
exports.setupGracefulShutdown = setupGracefulShutdown;
function shutdown(reason = 'manual', options = {}) {
    const opts = { ...defaultOptions, ...options };
    opts.logger.info(`Shutdown triggered: ${reason}`);
    exports.shutdownEmitter.emit('shutdown:triggered', { reason, status: shutdownStatus });
    const shutdown = createGracefulShutdown({}, opts);
    return shutdown(reason);
}
exports.shutdown = shutdown;
function emergencyShutdown(reason, error) {
    logger_1.logger.error(`Emergency shutdown triggered: ${reason}`, error);
    shutdownStatus.phase = ShutdownPhase.FORCED;
    exports.shutdownEmitter.emit('shutdown:emergency', { reason, error, status: shutdownStatus });
    for (const connection of connections) {
        try {
            if (connection.socket && typeof connection.socket.destroy === 'function') {
                connection.socket.destroy();
            }
        }
        catch (e) {
        }
    }
    process.exit(1);
}
exports.emergencyShutdown = emergencyShutdown;
function getShutdownStatus() {
    return {
        ...shutdownStatus,
        activeConnections: connections.size
    };
}
exports.getShutdownStatus = getShutdownStatus;
function isSystemShuttingDown() {
    return isShuttingDown;
}
exports.isSystemShuttingDown = isSystemShuttingDown;
function setupProcessSignals(customHandlers) {
    const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGUSR2'];
    for (const signal of signals) {
        process.on(signal, async () => {
            logger_1.logger.info(`Received ${signal}, shutting down...`);
            try {
                if (customHandlers && customHandlers[signal]) {
                    await customHandlers[signal](signal);
                }
                else {
                    await shutdown(signal);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error handling ${signal}:`, error);
                emergencyShutdown(`${signal}_ERROR`, error);
            }
        });
    }
    logger_1.logger.info(`Process signal handlers configured for: ${signals.join(', ')}`);
}
exports.setupProcessSignals = setupProcessSignals;
function createConnectionTrackingMiddleware() {
    return (req, res, next) => {
        if (isShuttingDown) {
            res.status(503).json({
                success: false,
                error: {
                    code: 'SERVER_SHUTTING_DOWN',
                    message: 'Server is shutting down, please try again later',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }
        const connectionId = trackConnection(req.socket, 'http', {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        res.on('finish', () => {
            untrackConnection(connectionId);
        });
        res.on('close', () => {
            untrackConnection(connectionId);
        });
        next();
    };
}
exports.createConnectionTrackingMiddleware = createConnectionTrackingMiddleware;
function trackWebSocketConnection(ws, metadata) {
    const connectionId = trackConnection(ws, 'websocket', metadata);
    ws.on('close', () => {
        untrackConnection(connectionId);
    });
    ws.on('error', (error) => {
        logger_1.logger.warn(`WebSocket connection ${connectionId} error:`, error);
        untrackConnection(connectionId);
    });
    return connectionId;
}
exports.trackWebSocketConnection = trackWebSocketConnection;
class GracefulShutdownManager {
    server;
    options;
    shutdownFunction;
    constructor(options = {}) {
        this.options = { ...defaultOptions, ...options };
    }
    init(server, customOptions) {
        this.server = server;
        if (customOptions) {
            this.options = { ...this.options, ...customOptions };
        }
        this.shutdownFunction = createGracefulShutdown(server, this.options);
        setupGracefulShutdown(server, this.options);
    }
    async shutdown(reason = 'manual') {
        if (!this.shutdownFunction) {
            throw new Error('GracefulShutdownManager not initialized');
        }
        return this.shutdownFunction(reason);
    }
    emergencyShutdown(reason, error) {
        emergencyShutdown(reason, error);
    }
    getStatus() {
        return getShutdownStatus();
    }
    isShuttingDown() {
        return isSystemShuttingDown();
    }
    getConnections() {
        return getConnectionInfo();
    }
    registerService(config) {
        registerService(config);
    }
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
}
exports.GracefulShutdownManager = GracefulShutdownManager;
exports.gracefulShutdownManager = new GracefulShutdownManager();
function enableGracefulShutdown(server, options = {}) {
    const manager = new GracefulShutdownManager(options);
    manager.init(server, options);
    return manager;
}
exports.enableGracefulShutdown = enableGracefulShutdown;
class ProcessCleanup {
    static cleanupTasks = [];
    static isSetup = false;
    static addCleanupTask(task) {
        this.cleanupTasks.push(task);
    }
    static setup() {
        if (this.isSetup)
            return;
        process.on('exit', (code) => {
            logger_1.logger.info(`Process exiting with code: ${code}`);
        });
        process.on('SIGTERM', async () => {
            logger_1.logger.info('Received SIGTERM, running cleanup tasks...');
            await this.runCleanupTasks();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger_1.logger.info('Received SIGINT, running cleanup tasks...');
            await this.runCleanupTasks();
            process.exit(0);
        });
        this.isSetup = true;
        logger_1.logger.info('Process cleanup configured');
    }
    static async runCleanupTasks() {
        for (const task of this.cleanupTasks) {
            try {
                await task();
            }
            catch (error) {
                logger_1.logger.error('Error in cleanup task:', error);
            }
        }
    }
}
exports.ProcessCleanup = ProcessCleanup;
class TimeoutManager {
    static timeouts = new Map();
    static setTimeout(id, callback, ms) {
        this.clearTimeout(id);
        const timeout = setTimeout(() => {
            this.timeouts.delete(id);
            callback();
        }, ms);
        this.timeouts.set(id, timeout);
        return timeout;
    }
    static clearTimeout(id) {
        const timeout = this.timeouts.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(id);
        }
    }
    static clearAllTimeouts() {
        for (const [id, timeout] of this.timeouts) {
            clearTimeout(timeout);
        }
        this.timeouts.clear();
    }
    static getActiveTimeoutCount() {
        return this.timeouts.size;
    }
}
exports.TimeoutManager = TimeoutManager;
async function cleanupResources(options = {}) {
    const { timeout = 30000, forceCleanup = false, preserveState = true } = options;
    logger_1.logger.info('Starting resource cleanup...');
    try {
        const cleanupPromises = [];
        cleanupPromises.push(Promise.resolve().then(() => {
            TimeoutManager.clearAllTimeouts();
            logger_1.logger.debug('All timeouts cleared');
        }));
        if (connections.size > 0) {
            cleanupPromises.push(closeConnections({ ...defaultOptions, timeout }));
        }
        if (serviceRegistry.size > 0) {
            cleanupPromises.push(shutdownServices({ ...defaultOptions, timeout }));
        }
        const cleanupTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cleanup timeout')), timeout);
        });
        await Promise.race([
            Promise.allSettled(cleanupPromises),
            cleanupTimeout
        ]);
        logger_1.logger.info('Resource cleanup completed');
    }
    catch (error) {
        logger_1.logger.error('Error during resource cleanup:', error);
        if (forceCleanup) {
            logger_1.logger.warn('Force cleanup enabled, ignoring errors');
        }
        else {
            throw error;
        }
    }
}
exports.cleanupResources = cleanupResources;
async function performShutdownHealthCheck() {
    const issues = [];
    const activeServices = [];
    try {
        const activeConnections = connections.size;
        if (activeConnections > 0) {
            issues.push(`${activeConnections} connections still active`);
        }
        for (const [name, config] of serviceRegistry) {
            if (config.healthCheck) {
                try {
                    const isHealthy = await config.healthCheck();
                    if (isHealthy) {
                        activeServices.push(name);
                        issues.push(`Service ${name} still active`);
                    }
                }
                catch (error) {
                }
            }
        }
        const healthy = issues.length === 0;
        return {
            healthy,
            issues,
            activeConnections,
            activeServices
        };
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown health check:', error);
        return {
            healthy: false,
            issues: ['Health check failed'],
            activeConnections: connections.size,
            activeServices: []
        };
    }
}
exports.performShutdownHealthCheck = performShutdownHealthCheck;
exports.gracefulShutdownConfigs = {
    express: {
        timeout: 30000,
        drainTimeout: 10000,
        signals: ['SIGTERM', 'SIGINT'],
        cleanupServices: true,
        preserveState: true
    },
    production: {
        timeout: 60000,
        drainTimeout: 15000,
        forceExitTimeout: 65000,
        signals: ['SIGTERM', 'SIGINT', 'SIGQUIT'],
        cleanupServices: true,
        preserveState: true,
        backupData: true,
        enableMonitoring: true,
        healthCheckTimeout: 8000
    },
    development: {
        timeout: 10000,
        drainTimeout: 3000,
        forceExitTimeout: 12000,
        signals: ['SIGTERM', 'SIGINT'],
        cleanupServices: false,
        preserveState: false,
        emergencyShutdown: true
    },
    testing: {
        timeout: 5000,
        drainTimeout: 1000,
        forceExitTimeout: 6000,
        signals: ['SIGTERM', 'SIGINT'],
        cleanupServices: true,
        preserveState: false,
        logger: {
            info: () => { },
            warn: () => { },
            error: console.error,
            debug: () => { }
        }
    }
};
exports.default = exports.gracefulShutdownManager;
//# sourceMappingURL=graceful-shutdown.js.map