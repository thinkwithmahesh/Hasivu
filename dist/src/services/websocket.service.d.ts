export declare class WebSocketService {
    constructor();
    broadcast(event: string, data: any): Promise<void>;
    sendToUser(userId: string, event: string, data: any): Promise<void>;
    getConnectedUsers(): Promise<string[]>;
    emitToKitchen(schoolId: string, event: string, data: any): Promise<void>;
    emitToUser(userId: string, event: string, data: any): Promise<void>;
    emitToSchool(schoolId: string, event: string, data: any): Promise<void>;
}
declare const webSocketServiceInstance: WebSocketService;
export declare const webSocketService: WebSocketService;
export declare const _webSocketService: WebSocketService;
export default webSocketServiceInstance;
//# sourceMappingURL=websocket.service.d.ts.map