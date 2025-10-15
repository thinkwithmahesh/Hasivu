"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelProcessor = void 0;
const logger_1 = require("../../../../utils/logger");
class ParallelProcessor {
    config;
    workerPool = [];
    taskQueue = [];
    loadBalancer;
    isRunning = false;
    constructor(config) {
        this.config = config;
        this.loadBalancer = new LoadBalancer(config.loadBalancing);
        logger_1.logger.info('ParallelProcessor initialized', { maxParallelism: config.maxParallelism });
    }
    async initialize() {
        logger_1.logger.info('Initializing Parallel Processor');
        await this.setupWorkerPool();
        await this.startTaskProcessor();
    }
    async executeParallel(queries) {
        logger_1.logger.info('Executing queries in parallel', { queryCount: queries.length });
        if (queries.length === 0) {
            return [];
        }
        try {
            const tasks = queries.map((query, index) => ({
                id: `task_${Date.now()}_${index}`,
                query,
                status: 'pending',
                createdAt: new Date(),
                priority: query.priority === 'high' ? 3 : query.priority === 'normal' ? 2 : 1
            }));
            this.taskQueue.push(...tasks);
            const results = await this.waitForCompletion(tasks);
            logger_1.logger.info('Parallel execution completed', {
                queryCount: queries.length,
                successCount: results.filter(r => r.rows && r.rows.length >= 0).length
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Parallel execution failed', { error, queryCount: queries.length });
            throw new Error(`Parallel execution failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async executeWithLoadBalancing(query) {
        logger_1.logger.info('Executing query with load balancing', { queryId: query.id });
        try {
            const worker = await this.loadBalancer.selectWorker(this.workerPool, query);
            if (!worker) {
                throw new Error('No available workers');
            }
            const result = await this.executeOnWorker(worker, query);
            this.loadBalancer.updateWorkerLoad(worker, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Load balanced execution failed', { queryId: query.id, error });
            throw new Error(`Load balanced execution failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getWorkerStatistics() {
        const totalWorkers = this.workerPool.length;
        const activeWorkers = this.workerPool.filter(w => w.status === 'active').length;
        const avgLoad = this.workerPool.reduce((sum, w) => sum + w.currentLoad, 0) / totalWorkers;
        return {
            totalWorkers,
            activeWorkers,
            avgLoad,
            queueSize: this.taskQueue.filter(t => t.status === 'pending').length,
            activeTasks: this.taskQueue.filter(t => t.status === 'processing').length,
            completedTasks: this.taskQueue.filter(t => t.status === 'completed').length
        };
    }
    async getHealth() {
        const stats = await this.getWorkerStatistics();
        const unhealthyWorkers = this.workerPool.filter(w => w.status === 'failed').length;
        return {
            status: unhealthyWorkers === 0 ? 'healthy' : 'warning',
            version: '1.0.0',
            lastUpdate: new Date(),
            performance: {
                workersActive: stats.activeWorkers,
                avgLoad: stats.avgLoad,
                throughput: this.calculateThroughput(),
                taskSuccessRate: this.calculateSuccessRate()
            },
            capacity: {
                maxParallelism: this.config.maxParallelism,
                adaptiveParallelism: this.config.adaptiveParallelism,
                workStealing: this.config.workStealing,
                queueSize: stats.queueSize
            }
        };
    }
    async setupWorkerPool() {
        logger_1.logger.info('Setting up worker pool', { maxParallelism: this.config.maxParallelism });
        for (let i = 0; i < this.config.maxParallelism; i++) {
            const worker = {
                id: `worker_${i + 1}`,
                status: 'active',
                currentLoad: 0,
                maxLoad: 100,
                tasksCompleted: 0,
                tasksActive: 0,
                lastHeartbeat: new Date(),
                capabilities: {
                    queryTypes: ['select', 'aggregate', 'join'],
                    maxMemory: 512 * 1024 * 1024,
                    maxConcurrency: 5
                },
                performance: {
                    avgResponseTime: 100,
                    successRate: 0.99,
                    errorRate: 0.01
                }
            };
            this.workerPool.push(worker);
        }
        this.startWorkerMonitoring();
    }
    async startTaskProcessor() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger_1.logger.info('Starting task processor');
        setInterval(async () => {
            await this.processTasks();
        }, 100);
        if (this.config.adaptiveParallelism) {
            setInterval(() => {
                this.adjustParallelism();
            }, 30000);
        }
        if (this.config.workStealing) {
            setInterval(() => {
                this.performWorkStealing();
            }, 5000);
        }
    }
    async processTasks() {
        const pendingTasks = this.taskQueue
            .filter(t => t.status === 'pending')
            .sort((a, b) => b.priority - a.priority);
        const availableWorkers = this.workerPool.filter(w => w.status === 'active' && w.tasksActive < w.capabilities.maxConcurrency);
        const tasksToProcess = Math.min(pendingTasks.length, availableWorkers.length);
        for (let i = 0; i < tasksToProcess; i++) {
            const task = pendingTasks[i];
            const worker = availableWorkers[i];
            this.assignTaskToWorker(task, worker);
        }
    }
    async assignTaskToWorker(task, worker) {
        task.status = 'processing';
        task.assignedWorker = worker.id;
        task.startedAt = new Date();
        worker.tasksActive++;
        worker.currentLoad = Math.min(worker.currentLoad + 20, worker.maxLoad);
        try {
            logger_1.logger.debug('Assigning task to worker', { taskId: task.id, workerId: worker.id });
            const result = await this.executeOnWorker(worker, task.query);
            task.status = 'completed';
            task.completedAt = new Date();
            task.result = result;
            worker.tasksCompleted++;
            worker.tasksActive--;
            worker.currentLoad = Math.max(worker.currentLoad - 20, 0);
            worker.lastHeartbeat = new Date();
            logger_1.logger.debug('Task completed successfully', { taskId: task.id, workerId: worker.id });
        }
        catch (error) {
            task.status = 'failed';
            task.completedAt = new Date();
            task.error = (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
            worker.tasksActive--;
            worker.currentLoad = Math.max(worker.currentLoad - 20, 0);
            worker.performance.errorRate = (worker.performance.errorRate * 0.9) + (1 * 0.1);
            logger_1.logger.error('Task execution failed', { taskId: task.id, workerId: worker.id, error });
        }
    }
    async executeOnWorker(worker, query) {
        const startTime = Date.now();
        const executionTime = this.estimateExecutionTime(query);
        await new Promise(resolve => setTimeout(resolve, executionTime));
        const result = {
            id: `result_${Date.now()}`,
            rows: this.generateMockData(query),
            columns: this.generateMockColumns(query) || [],
            rowCount: Math.floor(Math.random() * 1000) + 1,
            executionTimeMs: Date.now() - startTime,
            executedAt: new Date(),
            cached: false,
            tenantId: query.parameters?.tenantId || 'default',
            metadata: {
                tablesScanned: ['users', 'orders'],
                partitionsPruned: Math.floor(Math.random() * 5),
                indexesUsed: ['idx_users_email'],
                optimizations: ['predicate_pushdown'],
                cacheHit: false,
                tier: 'hot'
            }
        };
        worker.performance.avgResponseTime = (worker.performance.avgResponseTime * 0.9) + (result.executionTimeMs * 0.1);
        worker.performance.successRate = (worker.performance.successRate * 0.9) + (1 * 0.1);
        return result;
    }
    async waitForCompletion(tasks) {
        const results = [];
        const taskIds = new Set(tasks.map(t => t.id));
        return new Promise((resolve, reject) => {
            const checkCompletion = () => {
                const completedTasks = this.taskQueue.filter(t => taskIds.has(t.id) && (t.status === 'completed' || t.status === 'failed'));
                if (completedTasks.length === tasks.length) {
                    const sortedResults = completedTasks
                        .sort((a, b) => {
                        const aIndex = tasks.findIndex(t => t.id === a.id);
                        const bIndex = tasks.findIndex(t => t.id === b.id);
                        return aIndex - bIndex;
                    })
                        .map(t => t.result || this.createErrorResult(t));
                    resolve(sortedResults);
                }
                else {
                    setTimeout(checkCompletion, 100);
                }
            };
            checkCompletion();
            setTimeout(() => {
                reject(new Error('Parallel execution timeout'));
            }, 5 * 60 * 1000);
        });
    }
    createErrorResult(task) {
        return {
            id: `error_result_${task.id}`,
            rows: [],
            columns: [],
            rowCount: 0,
            executionTimeMs: task.completedAt ? task.completedAt.getTime() - task.createdAt.getTime() : 0,
            executedAt: new Date(),
            cached: false,
            tenantId: task.query.parameters?.tenantId || 'default',
            metadata: {
                tablesScanned: [],
                partitionsPruned: 0,
                indexesUsed: [],
                optimizations: [],
                cacheHit: false,
                tier: 'hot'
            }
        };
    }
    estimateExecutionTime(query) {
        const baseTime = 50;
        const complexityMultiplier = {
            'select': 1,
            'aggregate': 2,
            'join': 3,
            'window': 4,
            'analytical': 5,
            'olap': 6
        };
        return baseTime * (complexityMultiplier[query.queryType] || 1);
    }
    generateMockData(query) {
        const rowCount = Math.floor(Math.random() * 100) + 1;
        const data = [];
        for (let i = 0; i < rowCount; i++) {
            data.push({
                id: i + 1,
                name: `Item ${i + 1}`,
                value: Math.random() * 100,
                timestamp: new Date()
            });
        }
        return data;
    }
    generateMockColumns(query) {
        return [
            { name: 'id', type: 'integer', nullable: false },
            { name: 'name', type: 'varchar', nullable: false },
            { name: 'value', type: 'decimal', nullable: true, precision: 10, scale: 2 },
            { name: 'timestamp', type: 'timestamp', nullable: false }
        ];
    }
    startWorkerMonitoring() {
        setInterval(() => {
            this.workerPool.forEach(worker => {
                const timeSinceHeartbeat = Date.now() - worker.lastHeartbeat.getTime();
                if (timeSinceHeartbeat > 60000) {
                    worker.status = 'failed';
                    logger_1.logger.warn('Worker health check failed', { workerId: worker.id });
                }
            });
        }, 30000);
    }
    adjustParallelism() {
        const stats = this.workerPool.reduce((acc, w) => {
            acc.totalLoad += w.currentLoad;
            acc.avgResponseTime += w.performance.avgResponseTime;
            return acc;
        }, { totalLoad: 0, avgResponseTime: 0 });
        const avgLoad = stats.totalLoad / this.workerPool.length;
        const avgResponseTime = stats.avgResponseTime / this.workerPool.length;
        if (avgLoad > 80 && avgResponseTime > 200) {
            logger_1.logger.info('High system load detected', { avgLoad, avgResponseTime });
        }
        else if (avgLoad < 30 && this.taskQueue.filter(t => t.status === 'pending').length > 0) {
            logger_1.logger.info('System underutilized', { avgLoad, pendingTasks: this.taskQueue.filter(t => t.status === 'pending').length });
        }
    }
    performWorkStealing() {
        const overloadedWorkers = this.workerPool.filter(w => w.currentLoad > 80);
        const underloadedWorkers = this.workerPool.filter(w => w.currentLoad < 30);
        if (overloadedWorkers.length > 0 && underloadedWorkers.length > 0) {
            logger_1.logger.debug('Performing work stealing', {
                overloaded: overloadedWorkers.length,
                underloaded: underloadedWorkers.length
            });
        }
    }
    calculateThroughput() {
        const completedTasks = this.taskQueue.filter(t => t.status === 'completed').length;
        return completedTasks;
    }
    calculateSuccessRate() {
        const totalTasks = this.taskQueue.filter(t => t.status === 'completed' || t.status === 'failed').length;
        const successfulTasks = this.taskQueue.filter(t => t.status === 'completed').length;
        if (totalTasks === 0)
            return 1.0;
        return successfulTasks / totalTasks;
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Parallel Processor');
        this.isRunning = false;
        this.taskQueue = [];
        this.workerPool = [];
        logger_1.logger.info('Parallel Processor shutdown complete');
    }
    async getStatistics() {
        return await this.getWorkerStatistics();
    }
    async getHealthStatus() {
        return await this.getHealth();
    }
    async calculateOptimalParallelism() {
        const stats = await this.getWorkerStatistics();
        const avgLoad = stats.avgLoad;
        const queueSize = stats.queueSize;
        let optimalParallelism = this.config.maxParallelism;
        if (queueSize > 10 && avgLoad < 50) {
            optimalParallelism = Math.min(this.config.maxParallelism * 1.5, 32);
        }
        else if (avgLoad > 80) {
            optimalParallelism = Math.max(this.config.maxParallelism * 0.8, 1);
        }
        return Math.floor(optimalParallelism);
    }
}
exports.ParallelProcessor = ParallelProcessor;
class LoadBalancer {
    config;
    constructor(config) {
        this.config = config;
    }
    async selectWorker(workers, query) {
        const availableWorkers = workers.filter(w => w.status === 'active' && w.tasksActive < w.capabilities.maxConcurrency);
        if (availableWorkers.length === 0) {
            return null;
        }
        switch (this.config.strategy) {
            case 'round_robin':
                return this.selectRoundRobin(availableWorkers);
            case 'least_connections':
                return this.selectLeastConnections(availableWorkers);
            case 'resource_based':
                return this.selectResourceBased(availableWorkers);
            case 'adaptive':
                return this.selectAdaptive(availableWorkers, query);
            default:
                return availableWorkers[0];
        }
    }
    updateWorkerLoad(worker, result) {
        worker.performance.avgResponseTime = (worker.performance.avgResponseTime * 0.9) + (result.executionTimeMs * 0.1);
    }
    selectRoundRobin(workers) {
        return workers[Math.floor(Math.random() * workers.length)];
    }
    selectLeastConnections(workers) {
        return workers.reduce((best, current) => current.tasksActive < best.tasksActive ? current : best);
    }
    selectResourceBased(workers) {
        return workers.reduce((best, current) => current.currentLoad < best.currentLoad ? current : best);
    }
    selectAdaptive(workers, query) {
        return workers.reduce((best, current) => {
            const bestScore = this.calculateWorkerScore(best, query);
            const currentScore = this.calculateWorkerScore(current, query);
            return currentScore > bestScore ? current : best;
        });
    }
    calculateWorkerScore(worker, query) {
        let score = 100;
        score -= worker.currentLoad;
        score -= worker.tasksActive * 10;
        score += (worker.performance.successRate * 20);
        score -= (worker.performance.avgResponseTime / 10);
        if (worker.capabilities.queryTypes.includes(query.queryType)) {
            score += 10;
        }
        return score;
    }
}
exports.default = ParallelProcessor;
//# sourceMappingURL=parallel-processor.js.map