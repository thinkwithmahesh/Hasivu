import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare enum ReaderVendor {
    ZEBRA = "zebra",
    IMPINJ = "impinj",
    NXP = "nxp",
    HONEYWELL = "honeywell",
    ALIEN = "alien"
}
export declare enum ReaderStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    ERROR = "error",
    MAINTENANCE = "maintenance",
    CONFIGURING = "configuring"
}
declare class RFIDHardwareAbstraction {
    static getDefaultConfiguration(vendor: ReaderVendor): Record<string, any>;
    static validateConfiguration(vendor: ReaderVendor, config: Record<string, any>): {
        isValid: boolean;
        errors: string[];
    };
    static generateConnectionString(vendor: ReaderVendor, ipAddress: string, config: Record<string, any>): string;
}
export declare const manageReadersHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export { RFIDHardwareAbstraction };
//# sourceMappingURL=manage-readers.d.ts.map