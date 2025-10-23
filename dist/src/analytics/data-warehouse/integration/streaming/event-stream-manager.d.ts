import { EventStreamConfig } from '../../types/integration-types';
export declare class EventStreamManager {
    private config;
    constructor(config: EventStreamConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    publishEvent(topic: string, data: any): Promise<void>;
    subscribeToEvents(topics: string[]): Promise<void>;
}
export default EventStreamManager;
//# sourceMappingURL=event-stream-manager.d.ts.map