import { SystemConnector, ConnectionConfig, SyncResult, HealthStatus } from '../../types/integration-types';
export declare class PredictiveAnalyticsConnector implements SystemConnector {
    id: string;
    name: string;
    type: "predictive_analytics";
    status: 'connected' | 'disconnected' | 'error';
    config: ConnectionConfig;
    lastSync?: Date;
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
export default PredictiveAnalyticsConnector;
//# sourceMappingURL=predictive-analytics-connector.d.ts.map