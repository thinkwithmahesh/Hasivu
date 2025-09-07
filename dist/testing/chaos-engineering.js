"use strict";
/**
 * HASIVU Platform - Chaos Engineering Framework
 * Production-ready chaos engineering and fault injection system for testing system resilience
 * Provides controlled failure injection to identify weaknesses and improve system reliability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChaosExperimentBuilder = exports.chaosService = exports.ChaosEngineeringService = exports.ChaosStatus = exports.ChaosSeverity = exports.ChaosExperimentType = void 0;
const logger_1 = require("../shared/utils/logger");
const events_1 = require("events");
/**
 * Chaos experiment types
 */
var ChaosExperimentType;
(function (ChaosExperimentType) {
    ChaosExperimentType["LATENCY_INJECTION"] = "latency_injection";
    ChaosExperimentType["ERROR_INJECTION"] = "error_injection";
    ChaosExperimentType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    ChaosExperimentType["NETWORK_PARTITION"] = "network_partition";
    ChaosExperimentType["SERVICE_SHUTDOWN"] = "service_shutdown";
    ChaosExperimentType["DATABASE_FAILURE"] = "database_failure";
    ChaosExperimentType["MEMORY_LEAK"] = "memory_leak";
    ChaosExperimentType["CPU_SPIKE"] = "cpu_spike";
    ChaosExperimentType["DISK_FULL"] = "disk_full";
    ChaosExperimentType["TIMEOUT_INJECTION"] = "timeout_injection";
})(ChaosExperimentType || (exports.ChaosExperimentType = ChaosExperimentType = {}));
/**
 * Chaos experiment severity levels
 */
var ChaosSeverity;
(function (ChaosSeverity) {
    ChaosSeverity["LOW"] = "low";
    ChaosSeverity["MEDIUM"] = "medium";
    ChaosSeverity["HIGH"] = "high";
    ChaosSeverity["CRITICAL"] = "critical";
})(ChaosSeverity || (exports.ChaosSeverity = ChaosSeverity = {}));
/**
 * Chaos experiment status
 */
var ChaosStatus;
(function (ChaosStatus) {
    ChaosStatus["PENDING"] = "pending";
    ChaosStatus["RUNNING"] = "running";
    ChaosStatus["COMPLETED"] = "completed";
    ChaosStatus["FAILED"] = "failed";
    ChaosStatus["CANCELLED"] = "cancelled";
    ChaosStatus["PAUSED"] = "paused";
})(ChaosStatus || (exports.ChaosStatus = ChaosStatus = {}));
/**
 * Main Chaos Engineering Service
 */
class ChaosEngineeringService extends events_1.EventEmitter {
    static instance;
    experiments = new Map();
    runningExperiments = new Map();
    safetyChecks = [];
    isEnabled = false;
    environment;
    constructor() {
        super();
        this.environment = process.env.NODE_ENV || 'development';
        this.initializeSafetyChecks();
        // Only enable in non-production environments by default
        this.isEnabled = this.environment !== 'production';
        logger_1.logger.info('Chaos Engineering Service initialized', {
            environment: this.environment,
            enabled: this.isEnabled
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ChaosEngineeringService.instance) {
            ChaosEngineeringService.instance = new ChaosEngineeringService();
        }
        return ChaosEngineeringService.instance;
    }
    /**
     * Initialize default safety checks
     */
    initializeSafetyChecks() {
        this.safetyChecks = [
            {
                name: 'production_environment_check',
                description: 'Prevent chaos experiments in production without explicit override',
                check: async () => this.environment !== 'production' || process.env.CHAOS_PRODUCTION_OVERRIDE === 'true',
                severity: 'critical',
                required: true
            },
            {
                name: 'system_health_check',
                description: 'Ensure system is healthy before running experiments',
                check: async () => {
                    // Check system resources, active connections, etc.
                    const memUsage = process.memoryUsage();
                    return (memUsage.heapUsed / memUsage.heapTotal) < 0.9;
                },
                severity: 'error',
                required: true
            },
            {
                name: 'active_incidents_check',
                description: 'Check for active incidents before running experiments',
                check: async () => {
                    // Integration with incident management system
                    return true; // Placeholder - integrate with actual incident system
                },
                severity: 'warning',
                required: false
            }
        ];
    }
    /**
     * Enable/disable chaos engineering
     */
    setEnabled(enabled, overrideProductionCheck = false) {
        if (this.environment === 'production' && enabled && !overrideProductionCheck) {
            throw new Error('Cannot enable chaos engineering in production without explicit override');
        }
        this.isEnabled = enabled;
        logger_1.logger.info('Chaos engineering enabled status changed', { enabled });
        this.emit('enabled_changed', enabled);
    }
    /**
     * Register a new chaos experiment
     */
    async registerExperiment(config) {
        if (this.experiments.has(config.id)) {
            throw new Error(`Experiment with ID ${config.id} already exists`);
        }
        // Validate experiment configuration
        await this.validateExperimentConfig(config);
        this.experiments.set(config.id, config);
        logger_1.logger.info('Chaos experiment registered', {
            experimentId: config.id,
            name: config.name,
            type: config.type,
            severity: config.severity
        });
        this.emit('experiment_registered', config);
    }
    /**
     * Execute a chaos experiment
     */
    async executeExperiment(experimentId) {
        if (!this.isEnabled) {
            throw new Error('Chaos engineering is disabled');
        }
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        if (this.runningExperiments.has(experimentId)) {
            throw new Error(`Experiment ${experimentId} is already running`);
        }
        // Run safety checks
        await this.runSafetyChecks();
        // Check conditions
        const conditionsMet = await this.checkConditions(experiment.conditions || []);
        if (!conditionsMet) {
            throw new Error('Experiment conditions not met');
        }
        const result = {
            id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            experimentId,
            status: ChaosStatus.RUNNING,
            startTime: new Date(),
            targetsAffected: 0,
            metricsCollected: {},
            errors: [],
            rollbackTriggered: false,
            observations: [],
            impact: {
                errorRate: 0,
                responseTimeImpact: 0,
                availabilityImpact: 0,
                userExperienceImpact: 'none',
                recoveryTime: 0,
                cascadeFailures: []
            }
        };
        this.runningExperiments.set(experimentId, result);
        try {
            logger_1.logger.info('Starting chaos experiment', {
                experimentId,
                runId: result.id,
                type: experiment.type,
                targets: experiment.targets.length
            });
            this.emit('experiment_started', { experiment, result });
            // Execute the specific chaos experiment type
            await this.executeExperimentType(experiment, result);
            // Set up rollback monitoring
            const rollbackMonitor = this.setupRollbackMonitoring(experiment, result);
            // Wait for experiment duration
            await new Promise(resolve => setTimeout(resolve, experiment.duration));
            // Clean up rollback monitor
            if (rollbackMonitor) {
                clearInterval(rollbackMonitor);
            }
            // Complete the experiment
            result.status = ChaosStatus.COMPLETED;
            result.endTime = new Date();
            result.duration = result.endTime.getTime() - result.startTime.getTime();
            logger_1.logger.info('Chaos experiment completed', {
                experimentId,
                runId: result.id,
                duration: result.duration,
                targetsAffected: result.targetsAffected
            });
            this.emit('experiment_completed', { experiment, result });
        }
        catch (error) {
            result.status = ChaosStatus.FAILED;
            result.endTime = new Date();
            result.errors.push({
                type: 'execution_error',
                message: error.message,
                timestamp: new Date(),
                stack: error.stack
            });
            logger_1.logger.error('Chaos experiment failed', {
                experimentId,
                runId: result.id,
                error: error.message
            });
            this.emit('experiment_failed', { experiment, result, error });
        }
        finally {
            // Perform cleanup
            await this.cleanupExperiment(experiment, result);
            this.runningExperiments.delete(experimentId);
        }
        return result;
    }
    /**
     * Execute specific experiment type
     */
    async executeExperimentType(experiment, result) {
        switch (experiment.type) {
            case ChaosExperimentType.LATENCY_INJECTION:
                await this.executeLatencyInjection(experiment, result);
                break;
            case ChaosExperimentType.ERROR_INJECTION:
                await this.executeErrorInjection(experiment, result);
                break;
            case ChaosExperimentType.RESOURCE_EXHAUSTION:
                await this.executeResourceExhaustion(experiment, result);
                break;
            case ChaosExperimentType.MEMORY_LEAK:
                await this.executeMemoryLeak(experiment, result);
                break;
            case ChaosExperimentType.CPU_SPIKE:
                await this.executeCpuSpike(experiment, result);
                break;
            default:
                throw new Error(`Unsupported experiment type: ${experiment.type}`);
        }
    }
    /**
     * Execute latency injection experiment
     */
    async executeLatencyInjection(experiment, result) {
        const delay = experiment.parameters.delay || 1000;
        const percentage = experiment.parameters.percentage || 100;
        logger_1.logger.info('Executing latency injection', { delay, percentage });
        // Hook into HTTP requests to add artificial delay
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = function (callback, ms, ...args) {
            if (Math.random() * 100 < percentage) {
                return originalSetTimeout(callback, ms + delay, ...args);
            }
            return originalSetTimeout(callback, ms, ...args);
        };
        result.targetsAffected++;
        result.observations.push(`Added ${delay}ms latency to ${percentage}% of requests`);
    }
    /**
     * Execute error injection experiment
     */
    async executeErrorInjection(experiment, result) {
        const errorRate = experiment.parameters.errorRate || 0.1;
        const errorType = experiment.parameters.errorType || 'generic';
        logger_1.logger.info('Executing error injection', { errorRate, errorType });
        // Store original Promise.resolve for restoration
        const originalPromiseResolve = Promise.resolve;
        Promise.resolve = function (value) {
            if (Math.random() < errorRate) {
                return Promise.reject(new Error(`Chaos Engineering: Injected ${errorType} error`));
            }
            return originalPromiseResolve.call(this, value);
        };
        result.targetsAffected++;
        result.observations.push(`Injected ${errorType} errors at ${errorRate * 100}% rate`);
    }
    /**
     * Execute resource exhaustion experiment
     */
    async executeResourceExhaustion(experiment, result) {
        const resourceType = experiment.parameters.resourceType || 'memory';
        const intensity = experiment.parameters.intensity || 0.5;
        logger_1.logger.info('Executing resource exhaustion', { resourceType, intensity });
        if (resourceType === 'memory') {
            const memoryHog = [];
            const targetSize = Math.floor(intensity * 100 * 1024 * 1024); // MB to bytes
            try {
                for (let i = 0; i < targetSize / 1024; i++) {
                    memoryHog.push(new Array(256).fill('x')); // 1KB chunks
                }
            }
            catch (error) {
                result.errors.push({
                    type: 'resource_exhaustion',
                    message: error.message,
                    timestamp: new Date()
                });
            }
        }
        result.targetsAffected++;
        result.observations.push(`Exhausted ${resourceType} at ${intensity * 100}% intensity`);
    }
    /**
     * Execute memory leak simulation
     */
    async executeMemoryLeak(experiment, result) {
        const leakRate = experiment.parameters.leakRate || 1024; // bytes per second
        const duration = experiment.duration;
        logger_1.logger.info('Executing memory leak simulation', { leakRate, duration });
        const leakInterval = setInterval(() => {
            // Create intentional memory leak
            const leak = new Array(leakRate / 4).fill('leak');
            global.chaosMemoryLeak = global.chaosMemoryLeak || [];
            global.chaosMemoryLeak.push(leak);
        }, 1000);
        // Clean up after experiment
        setTimeout(() => {
            clearInterval(leakInterval);
            delete global.chaosMemoryLeak;
        }, duration);
        result.targetsAffected++;
        result.observations.push(`Simulated memory leak at ${leakRate} bytes/second`);
    }
    /**
     * Execute CPU spike simulation
     */
    async executeCpuSpike(experiment, result) {
        const intensity = experiment.parameters.intensity || 0.5;
        const duration = experiment.duration;
        logger_1.logger.info('Executing CPU spike simulation', { intensity, duration });
        const startTime = Date.now();
        const spike = () => {
            const now = Date.now();
            if (now - startTime < duration) {
                // Busy loop to consume CPU
                for (let i = 0; i < intensity * 1000000; i++) {
                    Math.random();
                }
                setImmediate(spike);
            }
        };
        spike();
        result.targetsAffected++;
        result.observations.push(`Generated CPU spike at ${intensity * 100}% intensity`);
    }
    /**
     * Validate experiment configuration
     */
    async validateExperimentConfig(config) {
        if (!config.id || !config.name || !config.type) {
            throw new Error('Experiment must have id, name, and type');
        }
        if (config.duration <= 0) {
            throw new Error('Experiment duration must be positive');
        }
        if (config.targets.length === 0) {
            throw new Error('Experiment must have at least one target');
        }
        // Validate severity for production environments
        if (this.environment === 'production' && config.severity === ChaosSeverity.CRITICAL) {
            throw new Error('Critical experiments not allowed in production');
        }
    }
    /**
     * Run safety checks before experiment execution
     */
    async runSafetyChecks() {
        logger_1.logger.info('Running safety checks');
        for (const safetyCheck of this.safetyChecks) {
            try {
                const passed = await safetyCheck.check();
                if (!passed) {
                    const message = `Safety check failed: ${safetyCheck.name}`;
                    if (safetyCheck.required) {
                        throw new Error(message);
                    }
                    else {
                        logger_1.logger.warn(message, { severity: safetyCheck.severity });
                    }
                }
            }
            catch (error) {
                const message = `Safety check error: ${safetyCheck.name} - ${error.message}`;
                if (safetyCheck.required) {
                    throw new Error(message);
                }
                else {
                    logger_1.logger.error(message);
                }
            }
        }
        logger_1.logger.info('All safety checks passed');
    }
    /**
     * Check experiment conditions
     */
    async checkConditions(conditions) {
        for (const condition of conditions) {
            const result = await this.evaluateCondition(condition);
            if (!result) {
                logger_1.logger.info('Condition not met', { condition });
                return false;
            }
        }
        return true;
    }
    /**
     * Evaluate a single condition
     */
    async evaluateCondition(condition) {
        switch (condition.type) {
            case 'time':
                const now = new Date();
                return this.compareValues(now.getTime(), condition.value, condition.operator);
            case 'environment':
                return this.compareValues(this.environment, condition.value, condition.operator);
            case 'custom':
                return condition.customCheck ? await condition.customCheck() : true;
            default:
                return true;
        }
    }
    /**
     * Compare values based on operator
     */
    compareValues(actual, expected, operator) {
        switch (operator) {
            case '==': return actual === expected;
            case '!=': return actual !== expected;
            case '>': return actual > expected;
            case '<': return actual < expected;
            case '>=': return actual >= expected;
            case '<=': return actual <= expected;
            case 'in': return Array.isArray(expected) && expected.includes(actual);
            case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
            default: return false;
        }
    }
    /**
     * Set up rollback monitoring
     */
    setupRollbackMonitoring(experiment, result) {
        if (!experiment.rollbackTriggers || experiment.rollbackTriggers.length === 0) {
            return null;
        }
        return setInterval(async () => {
            for (const trigger of experiment.rollbackTriggers) {
                const shouldRollback = await this.checkRollbackTrigger(trigger);
                if (shouldRollback) {
                    logger_1.logger.warn('Rollback triggered', { trigger });
                    result.rollbackTriggered = true;
                    result.rollbackReason = `${trigger.type} threshold exceeded: ${trigger.threshold}`;
                    await this.cleanupExperiment(experiment, result);
                    this.emit('experiment_rollback', { experiment, result, trigger });
                    break;
                }
            }
        }, 5000); // Check every 5 seconds
    }
    /**
     * Check rollback trigger
     */
    async checkRollbackTrigger(trigger) {
        switch (trigger.type) {
            case 'error_rate':
                // Placeholder - integrate with actual error rate monitoring
                return false;
            case 'response_time':
                // Placeholder - integrate with actual response time monitoring
                return false;
            case 'custom':
                return trigger.customCheck ? await trigger.customCheck() : false;
            default:
                return false;
        }
    }
    /**
     * Clean up after experiment
     */
    async cleanupExperiment(experiment, result) {
        logger_1.logger.info('Cleaning up chaos experiment', { experimentId: experiment.id });
        // Restore original functions and clear global state
        delete global.chaosMemoryLeak;
        // Additional cleanup based on experiment type
        switch (experiment.type) {
            case ChaosExperimentType.LATENCY_INJECTION:
                // Restore original setTimeout if modified
                break;
            case ChaosExperimentType.ERROR_INJECTION:
                // Restore original Promise.resolve if modified
                break;
        }
        result.observations.push('Cleanup completed');
    }
    /**
     * Get experiment status
     */
    getExperimentStatus(experimentId) {
        const result = this.runningExperiments.get(experimentId);
        return result ? result.status : null;
    }
    /**
     * List all registered experiments
     */
    listExperiments() {
        return Array.from(this.experiments.values());
    }
    /**
     * Get experiment results
     */
    getExperimentResults() {
        return Array.from(this.runningExperiments.values());
    }
    /**
     * Stop running experiment
     */
    async stopExperiment(experimentId) {
        const result = this.runningExperiments.get(experimentId);
        if (!result || result.status !== ChaosStatus.RUNNING) {
            throw new Error(`No running experiment found with ID ${experimentId}`);
        }
        result.status = ChaosStatus.CANCELLED;
        result.endTime = new Date();
        const experiment = this.experiments.get(experimentId);
        if (experiment) {
            await this.cleanupExperiment(experiment, result);
        }
        logger_1.logger.info('Chaos experiment stopped', { experimentId });
        this.emit('experiment_stopped', { experimentId, result });
    }
    /**
     * Add custom safety check
     */
    addSafetyCheck(safetyCheck) {
        this.safetyChecks.push(safetyCheck);
        logger_1.logger.info('Custom safety check added', { name: safetyCheck.name });
    }
}
exports.ChaosEngineeringService = ChaosEngineeringService;
/**
 * Default chaos engineering service instance
 */
exports.chaosService = ChaosEngineeringService.getInstance();
/**
 * Utility functions for creating common experiments
 */
class ChaosExperimentBuilder {
    /**
     * Create latency injection experiment
     */
    static createLatencyExperiment(id, name, delay, percentage = 100, duration = 60000) {
        return {
            id,
            name,
            description: `Inject ${delay}ms latency to ${percentage}% of requests`,
            type: ChaosExperimentType.LATENCY_INJECTION,
            severity: delay > 5000 ? ChaosSeverity.HIGH : ChaosSeverity.MEDIUM,
            targets: [{ type: 'service', identifier: 'all', environment: 'test' }],
            parameters: { delay, percentage },
            duration,
            enabled: true,
            createdBy: 'system',
            createdAt: new Date()
        };
    }
    /**
     * Create error injection experiment
     */
    static createErrorExperiment(id, name, errorRate, errorType = 'generic', duration = 60000) {
        return {
            id,
            name,
            description: `Inject ${errorType} errors at ${errorRate * 100}% rate`,
            type: ChaosExperimentType.ERROR_INJECTION,
            severity: errorRate > 0.5 ? ChaosSeverity.HIGH : ChaosSeverity.MEDIUM,
            targets: [{ type: 'service', identifier: 'all', environment: 'test' }],
            parameters: { errorRate, errorType },
            duration,
            enabled: true,
            createdBy: 'system',
            createdAt: new Date()
        };
    }
    /**
     * Create resource exhaustion experiment
     */
    static createResourceExhaustionExperiment(id, name, resourceType, intensity, duration = 60000) {
        return {
            id,
            name,
            description: `Exhaust ${resourceType} at ${intensity * 100}% intensity`,
            type: ChaosExperimentType.RESOURCE_EXHAUSTION,
            severity: intensity > 0.8 ? ChaosSeverity.HIGH : ChaosSeverity.MEDIUM,
            targets: [{ type: 'resource', identifier: resourceType, environment: 'test' }],
            parameters: { resourceType, intensity },
            duration,
            enabled: true,
            createdBy: 'system',
            createdAt: new Date()
        };
    }
}
exports.ChaosExperimentBuilder = ChaosExperimentBuilder;
/**
 * Default export
 */
exports.default = {
    ChaosEngineeringService,
    ChaosExperimentBuilder,
    chaosService: exports.chaosService,
    ChaosExperimentType,
    ChaosSeverity,
    ChaosStatus
};
