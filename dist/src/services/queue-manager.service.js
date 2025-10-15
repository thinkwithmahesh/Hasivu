"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const events_1 = require("events");
const logger_1 = require("../shared/utils/logger");
class QueueManager extends events_1.EventEmitter {
    config;
    queues = new Map();
    processingQueues = new Set();
    isRunning = false;
    constructor(config = {}) {
        super();
        this.config = config;
        logger_1.logger.info('QueueManager initialized');
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger_1.logger.info('QueueManager started');
    }
    async stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        this.queues.clear();
        this.processingQueues.clear();
        logger_1.logger.info('QueueManager stopped');
    }
    async enqueue(queueName, data, options = {}) {
        const message = {
            id: this.generateMessageId(),
            data,
            priority: options.priority || 0,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: options.maxRetries || this.config.maxRetries || 3
        };
        let queue = this.queues.get(queueName);
        if (!queue) {
            queue = [];
            this.queues.set(queueName, queue);
        }
        queue.push(message);
        queue.sort((a, b) => b.priority - a.priority);
        logger_1.logger.debug('Message enqueued', { queueName, messageId: message.id });
        this.emit('message:enqueued', { queueName, message });
        return message.id;
    }
    async dequeue(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue || queue.length === 0) {
            return null;
        }
        const message = queue.shift();
        if (message) {
            logger_1.logger.debug('Message dequeued', { queueName, messageId: message.id });
            this.emit('message:dequeued', { queueName, message });
        }
        return message || null;
    }
    async getQueueSize(queueName) {
        const queue = this.queues.get(queueName);
        return queue ? queue.length : 0;
    }
    async getQueueNames() {
        return Array.from(this.queues.keys());
    }
    async processQueue(queueName, processor, options = {}) {
        if (this.processingQueues.has(queueName)) {
            logger_1.logger.warn('Queue is already being processed', { queueName });
            return;
        }
        this.processingQueues.add(queueName);
        try {
            logger_1.logger.info('Starting queue processing', { queueName });
            let message = await this.dequeue(queueName);
            while (message) {
                try {
                    await processor(message);
                    logger_1.logger.debug('Message processed successfully', { queueName, messageId: message.id });
                }
                catch (error) {
                    logger_1.logger.error('Failed to process message', { queueName, messageId: message.id, error });
                    if (message.retryCount < message.maxRetries) {
                        message.retryCount++;
                        await this.enqueue(queueName, message.data, {
                            priority: message.priority,
                            maxRetries: message.maxRetries
                        });
                        logger_1.logger.info('Message requeued for retry', {
                            queueName,
                            messageId: message.id,
                            retryCount: message.retryCount
                        });
                    }
                    else {
                        logger_1.logger.error('Message exceeded max retries, moving to DLQ', {
                            queueName,
                            messageId: message.id
                        });
                        this.emit('message:failed', { queueName, message, error });
                    }
                }
                message = await this.dequeue(queueName);
            }
        }
        finally {
            this.processingQueues.delete(queueName);
            logger_1.logger.info('Finished queue processing', { queueName });
        }
    }
    async clearQueue(queueName) {
        this.queues.delete(queueName);
        logger_1.logger.info('Queue cleared', { queueName });
    }
    async getStats() {
        const stats = {
            totalQueues: this.queues.size,
            totalMessages: 0,
            queueSizes: {},
            isRunning: this.isRunning
        };
        for (const [name, queue] of this.queues) {
            stats.queueSizes[name] = queue.length;
            stats.totalMessages += queue.length;
        }
        return stats;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.QueueManager = QueueManager;
//# sourceMappingURL=queue-manager.service.js.map