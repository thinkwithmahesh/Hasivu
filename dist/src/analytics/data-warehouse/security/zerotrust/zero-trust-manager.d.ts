export declare class ZeroTrustManager {
    constructor();
    initialize(): Promise<void>;
    validateRequest(_request: any): Promise<any>;
    verifyIdentity(userId: string, context: any): Promise<boolean>;
    checkDeviceTrust(deviceId: string): Promise<boolean>;
    enforceMinimalAccess(userId: string, resource: string): Promise<any>;
    logSecurityEvent(event: any): Promise<void>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default ZeroTrustManager;
//# sourceMappingURL=zero-trust-manager.d.ts.map