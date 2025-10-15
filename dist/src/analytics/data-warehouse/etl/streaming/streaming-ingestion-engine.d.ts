/// <reference types="node" />
import { EventEmitter } from 'events';
export interface StreamingConfig {
    enabled: boolean;
    kafkaBrokers?: string[];
    topicPrefix?: string;
    consumerGroupId?: string;
    batchSize?: number;
    flushInterval?: number;
    retryAttempts?: number;
    compressionType?: 'gzip' | 'snappy' | 'lz4' | 'zstd';
    maxMemoryUsage?: number;
}
export interface StreamingMessage {
    key: string;
    value: any;
    topic: string;
    partition: number;
    offset: number;
    timestamp: Date;
    headers?: Record<string, string>;
}
export declare class StreamingIngestionEngine extends EventEmitter {
    private readonly config;
    private isInitialized;
    private isRunning;
    private consumers;
    private producers;
    private messageBuffer;
    private flushTimers;
    constructor(config: StreamingConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    startConsumer(topic: string, handler: (message: StreamingMessage) => Promise<void>): Promise<void>;
    stopConsumer(topic: string): Promise<void>;
    produceMessage(topic: string, message: any, key?: string): Promise<void>;
    getConsumerStats(topic: string): Promise<any>;
    getProducerStats(topic: string): Promise<any>;
    private initializeKafkaConnections;
    private getOrCreateProducer;
    private addToBuffer;
    private setupBufferFlushing;
    private flushBuffer;
    private stopProducer;
    registerPipeline(pipeline: any): Promise<void>;
    getHealthStatus(): Promise<any>;
}
//# sourceMappingURL=streaming-ingestion-engine.d.ts.map