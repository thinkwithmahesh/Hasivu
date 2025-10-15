"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationOrchestrator = void 0;
const events_1 = require("events");
const logger_1 = require("../../../shared/utils/logger");
const metrics_service_1 = require("../../../services/metrics.service");
const queue_manager_service_1 = require("../../../services/queue-manager.service");
const hasivu_system_connector_1 = require("./connectors/hasivu-system-connector");
const predictive_analytics_connector_1 = __importDefault(require("./connectors/predictive-analytics-connector"));
const business_intelligence_connector_1 = __importDefault(require("./connectors/business-intelligence-connector"));
const performance_monitoring_connector_1 = __importDefault(require("./connectors/performance-monitoring-connector"));
const vendor_marketplace_connector_1 = __importDefault(require("./connectors/vendor-marketplace-connector"));
const authentication_connector_1 = __importDefault(require("./connectors/authentication-connector"));
const kitchen_management_connector_1 = __importDefault(require("./connectors/kitchen-management-connector"));
const data_synchronizer_1 = require("./sync/data-synchronizer");
const event_stream_manager_1 = require("./streaming/event-stream-manager");
const api_gateway_1 = require("./gateway/api-gateway");
const service_mesh_manager_1 = require("./mesh/service-mesh-manager");
const health_monitor_1 = require("./health/health-monitor");
const data_flow_orchestrator_1 = require("./flow/data-flow-orchestrator");
class IntegrationOrchestrator extends events_1.EventEmitter {
    componentLogger = logger_1.logger.child({ component: 'IntegrationOrchestrator' });
    metrics = new metrics_service_1.MetricsCollector();
    queue = new queue_manager_service_1.QueueManager();
    systemConnectors = new Map();
    dataSynchronizer;
    eventStreamManager;
    apiGateway;
    serviceMesh;
    healthMonitor;
    dataFlowOrchestrator;
    isRunning = false;
    serviceRegistry = new Map();
    activeDataFlows = new Map();
    systemHealthStatus = new Map();
    orchestrationConfig;
    constructor(config) {
        super();
        this.orchestrationConfig = this.normalizeConfig(config);
        this.componentLogger.info('Initializing Integration Orchestrator', {
            enabledSystems: this.orchestrationConfig.systems?.enabled || [],
            syncEnabled: this.orchestrationConfig.sync?.enabled || false,
            streamingEnabled: this.orchestrationConfig.streaming?.enabled || false,
            apiGatewayEnabled: !!this.orchestrationConfig.apiGateway?.endpoint
        });
        this.dataSynchronizer = new data_synchronizer_1.DataSynchronizer(this.orchestrationConfig.sync);
        this.eventStreamManager = new event_stream_manager_1.EventStreamManager(this.orchestrationConfig.streaming);
        this.apiGateway = new api_gateway_1.APIGateway(this.orchestrationConfig.apiGateway);
        this.serviceMesh = new service_mesh_manager_1.ServiceMeshManager(this.orchestrationConfig.serviceMesh);
        this.healthMonitor = new health_monitor_1.HealthMonitor(this.orchestrationConfig.healthCheck);
        this.dataFlowOrchestrator = new data_flow_orchestrator_1.DataFlowOrchestrator(this.orchestrationConfig.dataFlow);
        this.initializeSystemConnectors();
        this.setupEventHandlers();
    }
    normalizeConfig(config) {
        if ('systems' in config && 'sync' in config) {
            return config;
        }
        const integrationConfig = config;
        return {
            systems: {
                enabled: [integrationConfig.type]
            },
            sync: {
                enabled: integrationConfig.enabled,
                frequency: integrationConfig.schedule?.frequency || 'hourly',
                batchSize: 1000,
                retryAttempts: integrationConfig.retryPolicy?.maxAttempts || 3,
                timeout: integrationConfig.connection.timeout || 30000
            },
            streaming: {
                enabled: false,
                topics: [],
                bufferSize: 10000,
                compression: true
            },
            apiGateway: {
                endpoint: integrationConfig.connection.endpoint,
                version: 'v1',
                rateLimit: integrationConfig.connection.rateLimits || {
                    requests: 1000,
                    windowMs: 60000
                },
                authentication: integrationConfig.connection.authentication
            },
            serviceMesh: {
                enabled: false,
                discovery: false,
                loadBalancing: 'round_robin',
                circuitBreaker: false
            },
            dataFlow: {
                enabled: true,
                maxConcurrent: 5,
                retryAttempts: 3,
                timeout: 30000,
                maxConcurrentFlows: 10,
                enableScheduling: true,
                metricsInterval: 5000,
                healthCheckInterval: 30000,
                metricsEnabled: true
            },
            tracing: {
                enabled: false,
                serviceName: 'integration-orchestrator',
                sampleRate: 0.1
            },
            healthCheck: integrationConfig.healthCheck
        };
    }
    async initializeComponent(component, name) {
        try {
            if (component && typeof component.initialize === 'function') {
                await component.initialize();
            }
            else {
                this.componentLogger.warn(`Component ${name} does not have initialize method`);
            }
        }
        catch (error) {
            this.componentLogger.error(`Failed to initialize ${name}`, { error });
            throw error;
        }
    }
    async shutdownComponent(component, name) {
        try {
            if (component && typeof component.shutdown === 'function') {
                await component.shutdown();
            }
            else {
                this.componentLogger.warn(`Component ${name} does not have shutdown method`);
            }
        }
        catch (error) {
            this.componentLogger.error(`Failed to shutdown ${name}`, { error });
        }
    }
    async safeCallMethod(component, methodName, args = [], context = '') {
        try {
            if (component && typeof component[methodName] === 'function') {
                return await component[methodName](...args);
            }
            else {
                this.componentLogger.warn(`${context}: Method ${methodName} not available`);
                return null;
            }
        }
        catch (error) {
            this.componentLogger.error(`${context}: Failed to call ${methodName}`, { error });
            return null;
        }
    }
    async start() {
        try {
            this.componentLogger.info('Starting Integration Orchestrator...');
            await Promise.all([
                this.initializeComponent(this.dataSynchronizer, 'DataSynchronizer'),
                this.initializeComponent(this.eventStreamManager, 'EventStreamManager'),
                this.initializeComponent(this.apiGateway, 'APIGateway'),
                this.initializeComponent(this.serviceMesh, 'ServiceMeshManager'),
                this.initializeComponent(this.healthMonitor, 'HealthMonitor'),
                this.initializeComponent(this.dataFlowOrchestrator, 'DataFlowOrchestrator')
            ]);
            await this.queue.start();
            await this.connectToSystems();
            await this.startDataSynchronization();
            if (this.orchestrationConfig.streaming?.enabled) {
                await this.startEventStreaming();
            }
            this.startHealthMonitoring();
            this.startBackgroundTasks();
            this.isRunning = true;
            this.componentLogger.info('Integration Orchestrator started successfully');
            this.emit('started');
        }
        catch (error) {
            this.componentLogger.error('Failed to start Integration Orchestrator', { error });
            throw error;
        }
    }
    async stop() {
        try {
            this.componentLogger.info('Stopping Integration Orchestrator...');
            this.isRunning = false;
            await this.stopAllDataFlows();
            await this.disconnectFromSystems();
            await Promise.all([
                this.shutdownComponent(this.dataSynchronizer, 'DataSynchronizer'),
                this.shutdownComponent(this.eventStreamManager, 'EventStreamManager'),
                this.shutdownComponent(this.apiGateway, 'APIGateway'),
                this.shutdownComponent(this.serviceMesh, 'ServiceMeshManager'),
                this.shutdownComponent(this.healthMonitor, 'HealthMonitor'),
                this.shutdownComponent(this.dataFlowOrchestrator, 'DataFlowOrchestrator')
            ]);
            await this.queue.stop();
            this.componentLogger.info('Integration Orchestrator stopped successfully');
            this.emit('stopped');
        }
        catch (error) {
            this.componentLogger.error('Error stopping Integration Orchestrator', { error });
            throw error;
        }
    }
    async registerSystem(systemId, connector) {
        try {
            logger_1.logger.info('Registering system connector', {
                systemId,
                type: connector.type
            });
            await this.initializeComponent(connector, `SystemConnector-${systemId}`);
            this.systemConnectors.set(systemId, connector);
            await this.safeCallMethod(this.serviceMesh, 'registerService', [systemId, {
                    connector,
                    healthEndpoint: connector.healthEndpoint,
                    capabilities: connector.capabilities
                }], 'ServiceMeshManager.registerService');
            this.safeCallMethod(this.healthMonitor, 'addHealthCheck', [systemId, async () => {
                    return await this.safeCallMethod(connector, 'getHealthStatus', [], 'SystemConnector.getHealthStatus');
                }], 'HealthMonitor.addHealthCheck');
            logger_1.logger.info('System connector registered successfully', { systemId });
            this.emit('system:registered', { systemId, connector });
        }
        catch (error) {
            logger_1.logger.error('Failed to register system connector', {
                error,
                systemId
            });
            throw error;
        }
    }
    async createDataFlow(flowDefinition) {
        try {
            logger_1.logger.info('Creating data flow', {
                flowId: flowDefinition.id,
                sourceSystem: flowDefinition.sourceSystem,
                targetSystem: flowDefinition.targetSystem
            });
            const sourceConnector = this.systemConnectors.get(flowDefinition.sourceSystem);
            const targetConnector = this.systemConnectors.get(flowDefinition.targetSystem);
            if (!sourceConnector) {
                throw new Error(`Source system not found: ${flowDefinition.sourceSystem}`);
            }
            if (!targetConnector) {
                throw new Error(`Target system not found: ${flowDefinition.targetSystem}`);
            }
            const dataFlow = await this.safeCallMethod(this.dataFlowOrchestrator, 'createFlow', [{
                    ...flowDefinition,
                    sourceConnector,
                    targetConnector,
                    createdAt: new Date(),
                    status: 'created'
                }], 'DataFlowOrchestrator.createFlow');
            this.activeDataFlows.set(dataFlow.id, dataFlow);
            if (flowDefinition.realtime) {
                await this.startDataFlow(dataFlow.id);
            }
            logger_1.logger.info('Data flow created successfully', {
                flowId: dataFlow.id
            });
            this.metrics.increment('integration.dataflow.created');
            this.emit('dataflow:created', dataFlow);
            return dataFlow;
        }
        catch (error) {
            logger_1.logger.error('Failed to create data flow', {
                error,
                flowDefinition
            });
            throw error;
        }
    }
    async startDataFlow(flowId) {
        try {
            const dataFlow = this.activeDataFlows.get(flowId);
            if (!dataFlow) {
                throw new Error(`Data flow not found: ${flowId}`);
            }
            logger_1.logger.info('Starting data flow', { flowId });
            await this.safeCallMethod(this.dataFlowOrchestrator, 'startFlow', [flowId], 'DataFlowOrchestrator.startFlow');
            dataFlow.status = 'running';
            dataFlow.startedAt = new Date();
            logger_1.logger.info('Data flow started successfully', { flowId });
            this.metrics.increment('integration.dataflow.started');
            this.emit('dataflow:started', dataFlow);
        }
        catch (error) {
            logger_1.logger.error('Failed to start data flow', { error, flowId });
            throw error;
        }
    }
    async synchronizeData(options = {}) {
        try {
            logger_1.logger.info('Starting data synchronization', { options });
            const systems = options.systems || Array.from(this.systemConnectors.keys());
            const syncJob = await this.safeCallMethod(this.dataSynchronizer, 'startSynchronization', [{
                    systems,
                    dataTypes: options.dataTypes,
                    fullSync: options.fullSync || false,
                    priority: options.priority || 'normal'
                }], 'DataSynchronizer.startSynchronization');
            logger_1.logger.info('Data synchronization started', {
                syncJobId: syncJob.id,
                affectedSystems: systems.length
            });
            this.metrics.increment('integration.sync.started');
            return {
                syncJobId: syncJob.id,
                affectedSystems: systems.length,
                estimatedDuration: syncJob.estimatedDuration
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to start data synchronization', { error });
            throw error;
        }
    }
    async publishEvent(event) {
        try {
            logger_1.logger.debug('Publishing integration event', {
                eventType: event.type,
                source: event.source,
                tenantId: event.tenantId
            });
            const tracedEvent = event;
            await this.safeCallMethod(this.eventStreamManager, 'publishEvent', [tracedEvent], 'EventStreamManager.publishEvent');
            this.metrics.increment('integration.events.published');
        }
        catch (error) {
            logger_1.logger.error('Failed to publish integration event', { error, event });
            throw error;
        }
    }
    async subscribeToEvents(eventTypes, handler) {
        try {
            const subscriptionId = await this.safeCallMethod(this.eventStreamManager, 'subscribe', [
                eventTypes,
                async (event) => {
                    try {
                        await handler(event);
                        this.metrics.increment('integration.events.processed');
                    }
                    catch (error) {
                        logger_1.logger.error('Error processing integration event', {
                            error,
                            event
                        });
                        this.metrics.increment('integration.events.processing.failed');
                    }
                }
            ], 'EventStreamManager.subscribe');
            logger_1.logger.info('Subscribed to integration events', {
                subscriptionId,
                eventTypes
            });
            return subscriptionId;
        }
        catch (error) {
            logger_1.logger.error('Failed to subscribe to integration events', {
                error,
                eventTypes
            });
            throw error;
        }
    }
    async getSystemHealth() {
        try {
            const systemHealths = await this.safeCallMethod(this.healthMonitor, 'getOverallHealth', [], 'HealthMonitor.getOverallHealth') || {};
            const dataFlowStatus = {};
            for (const [flowId, flow] of this.activeDataFlows) {
                dataFlowStatus[flowId] = {
                    status: flow.status,
                    lastSync: flow.lastSync || flow.createdAt
                };
            }
            const healthStatuses = Object.values(systemHealths).filter((h) => {
                return Boolean(h && typeof h === 'object' && 'status' in h);
            });
            const criticalCount = healthStatuses.filter(h => h.status === 'critical').length;
            const degradedCount = healthStatuses.filter(h => h.status === 'degraded').length;
            let overall;
            if (criticalCount > 0) {
                overall = 'critical';
            }
            else if (degradedCount > 0) {
                overall = 'degraded';
            }
            else {
                overall = 'healthy';
            }
            return {
                overall,
                systems: systemHealths,
                dataFlows: dataFlowStatus,
                metrics: {
                    connectedSystems: this.systemConnectors.size,
                    activeDataFlows: this.activeDataFlows.size,
                    eventsPublished: this.metrics.getCounter("integration.events.published") || 0,
                    eventsProcessed: this.metrics.getCounter("integration.events.processed") || 0,
                    syncJobs: this.metrics.getCounter("integration.sync.jobs") || 0
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get system health', { error });
            throw error;
        }
    }
    async getIntegrationStatistics() {
        try {
            const [syncStatsRaw, eventStatsRaw, performanceStats] = await Promise.all([
                this.safeCallMethod(this.dataSynchronizer, 'getStatistics', [], 'DataSynchronizer.getStatistics'),
                this.safeCallMethod(this.eventStreamManager, 'getStatistics', [], 'EventStreamManager.getStatistics'),
                this.getPerformanceStatistics()
            ]);
            const syncStats = syncStatsRaw || { jobs: 0, successful: 0, failed: 0, avgDuration: 0 };
            const eventStats = eventStatsRaw || { published: 0, processed: 0, failed: 0 };
            const healthySystemsCount = Array.from(this.systemHealthStatus.values())
                .filter(health => health.status === 'healthy').length;
            const activeFlowsCount = Array.from(this.activeDataFlows.values())
                .filter(flow => flow.status === 'running').length;
            const failedFlowsCount = Array.from(this.activeDataFlows.values())
                .filter(flow => flow.status === 'failed').length;
            return {
                systems: {
                    total: this.systemConnectors.size,
                    healthy: healthySystemsCount,
                    connected: this.systemConnectors.size
                },
                dataFlows: {
                    total: this.activeDataFlows.size,
                    active: activeFlowsCount,
                    failed: failedFlowsCount
                },
                events: eventStats,
                sync: syncStats,
                performance: performanceStats
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get integration statistics', { error });
            throw error;
        }
    }
    async getHealthStatus() {
        try {
            const [syncHealth, streamHealth, gatewayHealth, meshHealth, monitorHealth, flowHealth] = await Promise.all([
                this.safeCallMethod(this.dataSynchronizer, 'getHealthStatus', [], 'DataSynchronizer.getHealthStatus'),
                this.safeCallMethod(this.eventStreamManager, 'getHealthStatus', [], 'EventStreamManager.getHealthStatus'),
                this.safeCallMethod(this.apiGateway, 'getHealthStatus', [], 'APIGateway.getHealthStatus'),
                this.safeCallMethod(this.serviceMesh, 'getHealthStatus', [], 'ServiceMeshManager.getHealthStatus'),
                this.safeCallMethod(this.healthMonitor, 'getHealthStatus', [], 'HealthMonitor.getHealthStatus'),
                this.safeCallMethod(this.dataFlowOrchestrator, 'getHealthStatus', [], 'DataFlowOrchestrator.getHealthStatus')
            ]);
            const components = {
                dataSynchronizer: syncHealth || { healthy: false, details: { error: 'Health check failed' } },
                eventStreamManager: streamHealth || { healthy: false, details: { error: 'Health check failed' } },
                apiGateway: gatewayHealth || { healthy: false, details: { error: 'Health check failed' } },
                serviceMesh: meshHealth || { healthy: false, details: { error: 'Health check failed' } },
                healthMonitor: monitorHealth || { healthy: false, details: { error: 'Health check failed' } },
                dataFlowOrchestrator: flowHealth || { healthy: false, details: { error: 'Health check failed' } }
            };
            const healthy = Object.values(components).every(comp => comp.healthy) && this.isRunning;
            return {
                healthy,
                components,
                metrics: {
                    systemConnectors: this.systemConnectors.size,
                    activeDataFlows: this.activeDataFlows.size,
                    serviceRegistry: this.serviceRegistry.size,
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting health status', { error });
            return {
                healthy: false,
                components: {},
                metrics: {}
            };
        }
    }
    initializeSystemConnectors() {
        const defaultConfig = {
            endpoint: 'http://localhost:3000',
            method: 'REST',
            authentication: {
                type: 'none',
                credentials: {}
            },
            timeout: 5000
        };
        const connectors = [
            { id: 'predictive-analytics', connector: new predictive_analytics_connector_1.default(defaultConfig) },
            { id: 'business-intelligence', connector: new business_intelligence_connector_1.default(defaultConfig) },
            { id: 'performance-monitoring', connector: new performance_monitoring_connector_1.default(defaultConfig) },
            { id: 'vendor-marketplace', connector: new vendor_marketplace_connector_1.default(defaultConfig) },
            { id: 'authentication', connector: new authentication_connector_1.default(defaultConfig) },
            { id: 'kitchen-management', connector: new kitchen_management_connector_1.default(defaultConfig) },
            { id: 'hasivu-core', connector: new hasivu_system_connector_1.HasivuSystemConnector(defaultConfig) }
        ];
        connectors.forEach(({ id, connector }) => {
            this.systemConnectors.set(id, connector);
        });
    }
    async connectToSystems() {
        const connectionPromises = Array.from(this.systemConnectors.entries())
            .map(async ([systemId, connector]) => {
            try {
                await connector.connect();
                logger_1.logger.info('Connected to system', { systemId });
                this.emit('system:connected', { systemId, connector });
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to system', {
                    error,
                    systemId
                });
                this.emit('system:connection_failed', { systemId, error });
            }
        });
        await Promise.allSettled(connectionPromises);
    }
    async disconnectFromSystems() {
        const disconnectionPromises = Array.from(this.systemConnectors.entries())
            .map(async ([systemId, connector]) => {
            try {
                await connector.disconnect();
                logger_1.logger.info('Disconnected from system', { systemId });
            }
            catch (error) {
                logger_1.logger.error('Failed to disconnect from system', {
                    error,
                    systemId
                });
            }
        });
        await Promise.allSettled(disconnectionPromises);
    }
    async startDataSynchronization() {
        if (this.orchestrationConfig.sync?.enabled) {
            await this.synchronizeData({
                fullSync: false,
                priority: 'normal'
            });
        }
    }
    async startEventStreaming() {
        await this.subscribeToEvents(['data.created', 'data.updated', 'data.deleted', 'system.health'], async (event) => {
            await this.handleSystemEvent(event);
        });
    }
    async handleSystemEvent(event) {
        try {
            logger_1.logger.debug('Handling system event', {
                eventType: event.type,
                source: event.source
            });
            switch (event.type) {
                case 'data.created':
                case 'data.updated':
                case 'data.deleted':
                    await this.handleDataEvent(event);
                    break;
                case 'system.health':
                    await this.handleHealthEvent(event);
                    break;
                default:
                    logger_1.logger.debug('Unhandled event type', { eventType: event.type });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling system event', { error, event });
        }
    }
    async handleDataEvent(event) {
        const relevantFlows = Array.from(this.activeDataFlows.values())
            .filter(flow => flow.sourceSystem === event.source &&
            flow.dataType === event.metadata?.dataType);
        for (const flow of relevantFlows) {
            if (flow.realtime) {
                await this.safeCallMethod(this.dataFlowOrchestrator, 'triggerFlow', [flow.id, event], 'DataFlowOrchestrator.triggerFlow');
            }
        }
    }
    async handleHealthEvent(event) {
        const systemHealth = {
            systemId: event.source,
            status: event.metadata?.status === 'healthy' ? 'healthy' : event.metadata?.status === 'degraded' ? 'degraded' : 'critical',
            components: event.metadata?.components || {},
            uptime: event.metadata?.uptime || 0,
            lastCheck: new Date(),
            details: event.metadata?.details || {}
        };
        this.systemHealthStatus.set(event.source, systemHealth);
        if (systemHealth.status === 'critical') {
            this.emit('system:unhealthy', systemHealth);
        }
    }
    async stopAllDataFlows() {
        const stopPromises = Array.from(this.activeDataFlows.keys())
            .map(flowId => this.safeCallMethod(this.dataFlowOrchestrator, 'stopFlow', [flowId], 'DataFlowOrchestrator.stopFlow'));
        await Promise.allSettled(stopPromises);
    }
    startHealthMonitoring() {
        setInterval(async () => {
            await this.checkSystemHealth();
        }, 60 * 1000);
    }
    async checkSystemHealth() {
        try {
            for (const [systemId, connector] of this.systemConnectors) {
                try {
                    const health = await connector.getHealthStatus();
                    this.systemHealthStatus.set(systemId, {
                        systemId,
                        status: health?.status || 'critical',
                        components: { [systemId]: health || { status: 'critical', checks: [], lastUpdated: new Date() } },
                        uptime: 0,
                        lastCheck: new Date(),
                        details: health || {}
                    });
                }
                catch (error) {
                    this.systemHealthStatus.set(systemId, {
                        systemId,
                        status: 'critical',
                        components: {},
                        uptime: 0,
                        lastCheck: new Date(),
                        details: { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) || 'Unknown error' }
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error during health check', { error });
        }
    }
    async getPerformanceStatistics() {
        return {
            avgResponseTime: this.metrics.getGauge("integration.response.time") || 0 || 0,
            throughput: this.metrics.getCounter("integration.events.published") || 0 || 0,
            errorRate: this.calculateErrorRate()
        };
    }
    calculateErrorRate() {
        const totalRequests = this.metrics.getCounter("integration.events.published") || 0 || 0;
        const failedRequests = this.metrics.getCounter("integration.events.published") || 0 || 0;
        return totalRequests > 0 ? failedRequests / totalRequests : 0;
    }
    startBackgroundTasks() {
        setInterval(() => {
            this.monitorDataFlows();
        }, 30000);
        setInterval(() => {
            this.checkSystemConnectivity();
        }, 2 * 60 * 1000);
        setInterval(() => {
            this.collectIntegrationMetrics();
        }, 60 * 1000);
    }
    async monitorDataFlows() {
        try {
            for (const [flowId, flow] of this.activeDataFlows) {
                if (flow.status === 'running') {
                    const flowHealth = await this.safeCallMethod(this.dataFlowOrchestrator, 'getFlowHealth', [flowId], 'DataFlowOrchestrator.getFlowHealth');
                    if (flowHealth && !flowHealth.healthy) {
                        logger_1.logger.warn('Unhealthy data flow detected', {
                            flowId,
                            issues: flowHealth.issues
                        });
                        this.emit('dataflow:unhealthy', { flowId, health: flowHealth });
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring data flows', { error });
        }
    }
    async checkSystemConnectivity() {
        try {
            for (const [systemId, connector] of this.systemConnectors) {
                const isConnected = await this.safeCallMethod(connector, 'isConnected', [], 'SystemConnector.isConnected');
                if (!isConnected) {
                    logger_1.logger.warn('System connectivity lost', { systemId });
                    try {
                        await connector.connect();
                        logger_1.logger.info('System reconnected successfully', { systemId });
                    }
                    catch (error) {
                        logger_1.logger.error('Failed to reconnect to system', {
                            error,
                            systemId
                        });
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking system connectivity', { error });
        }
    }
    async collectIntegrationMetrics() {
        try {
            const connectionPromises = Array.from(this.systemConnectors.values())
                .map(async (_connector) => {
                const connected = await this.safeCallMethod(_connector, 'isConnected', [], 'SystemConnector.isConnected');
                return connected === true;
            });
            const connectionResults = await Promise.all(connectionPromises);
            const connectedSystems = connectionResults.filter(Boolean).length;
            const activeFlows = Array.from(this.activeDataFlows.values())
                .filter(flow => flow.status === 'running').length;
            this.metrics.gauge('integration.systems.connected', connectedSystems);
            this.metrics.gauge('integration.dataflows.active', activeFlows);
        }
        catch (error) {
            logger_1.logger.error('Error collecting integration metrics', { error });
        }
    }
    setupEventHandlers() {
        this.on('system:connected', ({ systemId }) => {
            logger_1.logger.info('System connected event', { systemId });
            this.metrics.increment('integration.events.system.connected');
        });
        this.on('system:disconnected', ({ systemId }) => {
            logger_1.logger.warn('System disconnected event', { systemId });
            this.metrics.increment('integration.events.system.disconnected');
        });
        this.on('system:unhealthy', (health) => {
            logger_1.logger.warn('System unhealthy event', { health });
            this.metrics.increment('integration.events.system.unhealthy');
        });
        this.on('dataflow:created', (flow) => {
            logger_1.logger.info('Data flow created event', { flowId: flow.id });
            this.metrics.increment('integration.events.dataflow.created');
        });
        this.on('dataflow:started', (flow) => {
            logger_1.logger.info('Data flow started event', { flowId: flow.id });
            this.metrics.increment('integration.events.dataflow.started');
        });
        this.on('dataflow:unhealthy', ({ flowId }) => {
            logger_1.logger.warn('Data flow unhealthy event', { flowId });
            this.metrics.increment('integration.events.dataflow.unhealthy');
        });
        this.on('error', (error) => {
            logger_1.logger.error('Integration orchestrator error', { error });
            this.metrics.increment('integration.errors.orchestrator');
        });
    }
}
exports.IntegrationOrchestrator = IntegrationOrchestrator;
//# sourceMappingURL=integration-orchestrator.js.map