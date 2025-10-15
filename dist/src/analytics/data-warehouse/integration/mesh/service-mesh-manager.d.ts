import { ServiceMeshConfig } from '../../types/integration-types';
export declare class ServiceMeshManager {
    constructor(_config: ServiceMeshConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
}
export default ServiceMeshManager;
//# sourceMappingURL=service-mesh-manager.d.ts.map