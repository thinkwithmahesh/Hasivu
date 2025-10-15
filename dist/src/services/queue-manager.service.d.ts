/// <reference types="node" />
import { EventEmitter } from 'events';
export interface QueueMessage {
    id: string;
    data: any;
    priority: number;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
}
export interface QueueConfig {
    maxSize?: number;
    retryDelay?: number;
    maxRetries?: number;
}
export declare class QueueManager extends EventEmitter {
    private readonly config;
    private readonly queues;
    private readonly processingQueues;
    private isRunning;
    constructor(config?: QueueConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    enqueue(queueName: string, data: any, options?: {
        priority?: number;
        maxRetries?: number;
    }): Promise<string>;
    dequeue(queueName: string): Promise<QueueMessage | null>;
    getQueueSize(queueName: string): Promise<number>;
    getQueueNames(): Promise<string[]>;
    processQueue(queueName: string, processor: (message: QueueMessage) => Promise<void>, options?: {
        concurrency?: number;
    }): Promise<void>;
    clearQueue(queueName: string): Promise<void>;
    getStats(): Promise<Record<string, any>>;
    private generateMessageId;
}
//# sourceMappingURL=queue-manager.service.d.ts.map