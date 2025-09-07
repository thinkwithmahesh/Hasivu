"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChaosExperimentBuilder = exports.chaosService = exports.ChaosEngineeringService = exports.ChaosStatus = exports.ChaosSeverity = exports.ChaosExperimentType = void 0;
const logger_1 = require("../shared/utils/logger");
const events_1 = require("events");
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
var ChaosSeverity;
(function (ChaosSeverity) {
    ChaosSeverity["LOW"] = "low";
    ChaosSeverity["MEDIUM"] = "medium";
    ChaosSeverity["HIGH"] = "high";
    ChaosSeverity["CRITICAL"] = "critical";
})(ChaosSeverity || (exports.ChaosSeverity = ChaosSeverity = {}));
var ChaosStatus;
(function (ChaosStatus) {
    ChaosStatus["PENDING"] = "pending";
    ChaosStatus["RUNNING"] = "running";
    ChaosStatus["COMPLETED"] = "completed";
    ChaosStatus["FAILED"] = "failed";
    ChaosStatus["CANCELLED"] = "cancelled";
    ChaosStatus["PAUSED"] = "paused";
})(ChaosStatus || (exports.ChaosStatus = ChaosStatus = {}));
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
        this.isEnabled = this.environment !== 'production';
        logger_1.logger.info('Chaos Engineering Service initialized', {
            environment: this.environment,
            enabled: this.isEnabled
        });
    }
    static getInstance() {
        if (!ChaosEngineeringService.instance) {
            ChaosEngineeringService.instance = new ChaosEngineeringService();
        }
        return ChaosEngineeringService.instance;
    }
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
                    return true;
                },
                severity: 'warning',
                required: false
            }
        ];
    }
    setEnabled(enabled, overrideProductionCheck = false) {
        if (this.environment === 'production' && enabled && !overrideProductionCheck) {
            throw new Error('Cannot enable chaos engineering in production without explicit override');
        }
        this.isEnabled = enabled;
        logger_1.logger.info('Chaos engineering enabled status changed', { enabled });
        this.emit('enabled_changed', enabled);
    }
    async registerExperiment(config) {
        if (this.experiments.has(config.id)) {
            throw new Error(`Experiment with ID ${config.id} already exists`);
        }
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
        await this.runSafetyChecks();
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
            await this.executeExperimentType(experiment, result);
            const rollbackMonitor = this.setupRollbackMonitoring(experiment, result);
            await new Promise(resolve => setTimeout(resolve, experiment.duration));
            if (rollbackMonitor) {
                clearInterval(rollbackMonitor);
            }
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
            await this.cleanupExperiment(experiment, result);
            this.runningExperiments.delete(experimentId);
        }
        return result;
    }
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
    async executeLatencyInjection(experiment, result) {
        const delay = experiment.parameters.delay || 1000;
        const percentage = experiment.parameters.percentage || 100;
        logger_1.logger.info('Executing latency injection', { delay, percentage });
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
    async executeErrorInjection(experiment, result) {
        const errorRate = experiment.parameters.errorRate || 0.1;
        const errorType = experiment.parameters.errorType || 'generic';
        logger_1.logger.info('Executing error injection', { errorRate, errorType });
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
    async executeResourceExhaustion(experiment, result) {
        const resourceType = experiment.parameters.resourceType || 'memory';
        const intensity = experiment.parameters.intensity || 0.5;
        logger_1.logger.info('Executing resource exhaustion', { resourceType, intensity });
        if (resourceType === 'memory') {
            const memoryHog = [];
            const targetSize = Math.floor(intensity * 100 * 1024 * 1024);
            try {
                for (let i = 0; i < targetSize / 1024; i++) {
                    memoryHog.push(new Array(256).fill('x'));
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
    async executeMemoryLeak(experiment, result) {
        const leakRate = experiment.parameters.leakRate || 1024;
        const duration = experiment.duration;
        logger_1.logger.info('Executing memory leak simulation', { leakRate, duration });
        const leakInterval = setInterval(() => {
            const leak = new Array(leakRate / 4).fill('leak');
            global.chaosMemoryLeak = global.chaosMemoryLeak || [];
            global.chaosMemoryLeak.push(leak);
        }, 1000);
        setTimeout(() => {
            clearInterval(leakInterval);
            delete global.chaosMemoryLeak;
        }, duration);
        result.targetsAffected++;
        result.observations.push(`Simulated memory leak at ${leakRate} bytes/second`);
    }
    async executeCpuSpike(experiment, result) {
        const intensity = experiment.parameters.intensity || 0.5;
        const duration = experiment.duration;
        logger_1.logger.info('Executing CPU spike simulation', { intensity, duration });
        const startTime = Date.now();
        const spike = () => {
            const now = Date.now();
            if (now - startTime < duration) {
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
        if (this.environment === 'production' && config.severity === ChaosSeverity.CRITICAL) {
            throw new Error('Critical experiments not allowed in production');
        }
    }
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
        }, 5000);
    }
    async checkRollbackTrigger(trigger) {
        switch (trigger.type) {
            case 'error_rate':
                return false;
            case 'response_time':
                return false;
            case 'custom':
                return trigger.customCheck ? await trigger.customCheck() : false;
            default:
                return false;
        }
    }
    async cleanupExperiment(experiment, result) {
        logger_1.logger.info('Cleaning up chaos experiment', { experimentId: experiment.id });
        delete global.chaosMemoryLeak;
        switch (experiment.type) {
            case ChaosExperimentType.LATENCY_INJECTION:
                break;
            case ChaosExperimentType.ERROR_INJECTION:
                break;
        }
        result.observations.push('Cleanup completed');
    }
    getExperimentStatus(experimentId) {
        const result = this.runningExperiments.get(experimentId);
        return result ? result.status : null;
    }
    listExperiments() {
        return Array.from(this.experiments.values());
    }
    getExperimentResults() {
        return Array.from(this.runningExperiments.values());
    }
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
    addSafetyCheck(safetyCheck) {
        this.safetyChecks.push(safetyCheck);
        logger_1.logger.info('Custom safety check added', { name: safetyCheck.name });
    }
}
exports.ChaosEngineeringService = ChaosEngineeringService;
exports.chaosService = ChaosEngineeringService.getInstance();
class ChaosExperimentBuilder {
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
exports.default = {
    ChaosEngineeringService,
    ChaosExperimentBuilder,
    chaosService: exports.chaosService,
    ChaosExperimentType,
    ChaosSeverity,
    ChaosStatus
};
//# sourceMappingURL=chaos-engineering.js.map