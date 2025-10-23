import { DataSyncConfig } from '../../types/integration-types';
export declare class DataSynchronizer {
    private config;
    constructor(config: DataSyncConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    syncData(sourceId: string, targetId: string): Promise<void>;
}
export default DataSynchronizer;
//# sourceMappingURL=data-synchronizer.d.ts.map