"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingIngestionEngine = void 0;
const events_1 = require("events");
const logger_1 = require("../../../../shared/utils/logger");
class StreamingIngestionEngine extends events_1.EventEmitter {
    config;
    isInitialized = false;
    isRunning = false;
    consumers = new Map();
    producers = new Map();
    messageBuffer = new Map();
    flushTimers = new Map();
    constructor(config) {
        super();
        this.config = config;
        logger_1.logger.info('StreamingIngestionEngine initialized', {
            enabled: config.enabled,
            batchSize: config.batchSize || 1000
        });
    }
    async initialize() {
        if (this.isInitialized || !this.config.enabled) {
            return;
        }
        try {
            logger_1.logger.info('Initializing Streaming Ingestion Engine...');
            await this.initializeKafkaConnections();
            this.isInitialized = true;
            logger_1.logger.info('Streaming Ingestion Engine initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Streaming Ingestion Engine', { error });
            throw error;
        }
    }
    async shutdown() {
        if (!this.isInitialized)
            return;
        try {
            logger_1.logger.info('Shutting down Streaming Ingestion Engine...');
            for (const [topic] of this.consumers) {
                await this.stopConsumer(topic);
            }
            for (const [topic] of this.producers) {
                await this.stopProducer(topic);
            }
            for (const timer of this.flushTimers.values()) {
                clearTimeout(timer);
            }
            this.isInitialized = false;
            this.isRunning = false;
            logger_1.logger.info('Streaming Ingestion Engine shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('Error shutting down Streaming Ingestion Engine', { error });
            throw error;
        }
    }
    async startConsumer(topic, handler) {
        if (!this.isInitialized) {
            throw new Error('StreamingIngestionEngine not initialized');
        }
        logger_1.logger.info('Starting consumer for topic', { topic });
        const consumer = {
            topic,
            handler,
            isRunning: true,
            messageCount: 0
        };
        this.consumers.set(topic, consumer);
        this.setupBufferFlushing(topic);
        logger_1.logger.info('Consumer started successfully', { topic });
    }
    async stopConsumer(topic) {
        const consumer = this.consumers.get(topic);
        if (!consumer)
            return;
        logger_1.logger.info('Stopping consumer for topic', { topic });
        consumer.isRunning = false;
        this.consumers.delete(topic);
        const timer = this.flushTimers.get(topic);
        if (timer) {
            clearTimeout(timer);
            this.flushTimers.delete(topic);
        }
        await this.flushBuffer(topic);
        logger_1.logger.info('Consumer stopped successfully', { topic });
    }
    async produceMessage(topic, message, key) {
        if (!this.isInitialized) {
            throw new Error('StreamingIngestionEngine not initialized');
        }
        const producer = this.getOrCreateProducer(topic);
        const streamingMessage = {
            key: key || Date.now().toString(),
            value: message,
            topic,
            partition: 0,
            offset: producer.messageCount++,
            timestamp: new Date(),
            headers: {}
        };
        this.addToBuffer(topic, streamingMessage);
        logger_1.logger.debug('Message produced to topic', { topic, key });
    }
    async getConsumerStats(topic) {
        const consumer = this.consumers.get(topic);
        if (!consumer) {
            return null;
        }
        return {
            topic,
            isRunning: consumer.isRunning,
            messageCount: consumer.messageCount,
            bufferSize: this.messageBuffer.get(topic)?.length || 0,
            lastProcessedAt: new Date()
        };
    }
    async getProducerStats(topic) {
        const producer = this.producers.get(topic);
        if (!producer) {
            return null;
        }
        return {
            topic,
            messageCount: producer.messageCount,
            isHealthy: true,
            lastProducedAt: new Date()
        };
    }
    async initializeKafkaConnections() {
        logger_1.logger.info('Kafka connections initialized (mock)');
    }
    getOrCreateProducer(topic) {
        let producer = this.producers.get(topic);
        if (!producer) {
            producer = {
                topic,
                messageCount: 0,
                isHealthy: true
            };
            this.producers.set(topic, producer);
        }
        return producer;
    }
    addToBuffer(topic, message) {
        let buffer = this.messageBuffer.get(topic);
        if (!buffer) {
            buffer = [];
            this.messageBuffer.set(topic, buffer);
        }
        buffer.push(message);
        if (buffer.length >= (this.config.batchSize || 1000)) {
            this.flushBuffer(topic);
        }
    }
    setupBufferFlushing(topic) {
        const flushInterval = this.config.flushInterval || 5000;
        const timer = setInterval(async () => {
            await this.flushBuffer(topic);
        }, flushInterval);
        this.flushTimers.set(topic, timer);
    }
    async flushBuffer(topic) {
        const buffer = this.messageBuffer.get(topic);
        if (!buffer || buffer.length === 0)
            return;
        const consumer = this.consumers.get(topic);
        if (!consumer || !consumer.handler)
            return;
        const messages = buffer.splice(0);
        try {
            for (const message of messages) {
                await consumer.handler(message);
                consumer.messageCount++;
            }
            logger_1.logger.debug('Buffer flushed for topic', { topic, messageCount: messages.length });
        }
        catch (error) {
            logger_1.logger.error('Error flushing buffer for topic', { topic, error });
            buffer.unshift(...messages);
        }
    }
    async stopProducer(topic) {
        const producer = this.producers.get(topic);
        if (!producer)
            return;
        logger_1.logger.info('Stopping producer for topic', { topic });
        this.producers.delete(topic);
    }
    async registerPipeline(pipeline) {
        logger_1.logger.info('Registering pipeline with streaming engine', { pipelineId: pipeline.id });
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            isRunning: this.isInitialized,
            activeConsumers: this.consumers.size,
            activeProducers: this.producers.size
        };
    }
}
exports.StreamingIngestionEngine = StreamingIngestionEngine;
//# sourceMappingURL=streaming-ingestion-engine.js.map