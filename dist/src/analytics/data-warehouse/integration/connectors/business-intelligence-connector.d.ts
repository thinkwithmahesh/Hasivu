import { SystemConnector, ConnectionConfig, SyncResult, HealthStatus } from '../../types/integration-types';
export declare class Connector implements SystemConnector {
    id: string;
    name: string;
    type: "hasivu_system";
    status: 'connected' | 'disconnected' | 'error';
    config: ConnectionConfig;
    health: {
        status: "healthy";
        checks: never[];
        lastUpdated: Date;
    };
    constructor(config: ConnectionConfig);
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    sync(): Promise<SyncResult>;
    healthCheck(): Promise<void>;
    initialize(): Promise<void>;
    getHealthStatus(): Promise<HealthStatus>;
    isConnected(): Promise<boolean>;
}
export default Connector;
//# sourceMappingURL=business-intelligence-connector.d.ts.map