import { StorageLocation } from '../../types/data-lake-types';
export interface ReplicationConfig {
    source: StorageLocation;
    destination: StorageLocation;
    estimatedSize?: number;
}
export interface ReplicationStatus {
    id: string;
    source: StorageLocation;
    destination: StorageLocation;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    bytesTransferred: number;
    totalBytes: number;
}
export declare class ReplicationManager {
    private replications;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    replicate(sourceId: string, destinationId: string, options?: any): Promise<string>;
    startReplication(config: ReplicationConfig): Promise<string>;
    getReplicationStatus(replicationId: string): Promise<ReplicationStatus | null>;
    private simulateReplication;
}
export default ReplicationManager;
//# sourceMappingURL=replication-manager.d.ts.map