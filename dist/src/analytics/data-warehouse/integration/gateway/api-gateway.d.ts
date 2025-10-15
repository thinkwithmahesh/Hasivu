import { APIGatewayConfig } from '../../types/integration-types';
export declare class APIGateway {
    private config;
    constructor(config: APIGatewayConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    routeRequest(path: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
}
export default APIGateway;
//# sourceMappingURL=api-gateway.d.ts.map