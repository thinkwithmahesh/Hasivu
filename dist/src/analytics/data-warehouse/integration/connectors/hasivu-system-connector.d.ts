import { SystemConnector, ConnectionConfig, SyncResult, HealthStatus } from '../../types/integration-types';
export declare class HasivuSystemConnector implements SystemConnector {
    id: string;
    name: string;
    type: "hasivu_system";
    status: 'connected' | 'disconnected' | 'error';
    config: ConnectionConfig;
    lastSync?: Date;
    health: HealthStatus;
    constructor(config: ConnectionConfig);
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    sync(): Promise<SyncResult>;
    healthCheck(): Promise<void>;
    initialize(): Promise<void>;
    get healthEndpoint(): string;
    get capabilities(): string[];
    getHealthStatus(): Promise<HealthStatus>;
    isConnected(): Promise<boolean>;
}
export default HasivuSystemConnector;
//# sourceMappingURL=hasivu-system-connector.d.ts.map