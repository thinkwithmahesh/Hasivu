import { Server as SocketIO } from 'socket.io';
import { featureFlags } from '../config/feature-flags';
import { logger } from '../utils/logger';

export class WebSocketService {
  private static io: SocketIO | null = null;

  static attach(io: SocketIO | null): void {
    WebSocketService.io = io;
  }

  private get io(): SocketIO | null {
    return featureFlags.isEnabled('REALTIME_ENABLED') ? WebSocketService.io : null;
  }

  async broadcast(event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  async sendToUser(userId: string, event: string, data: unknown): Promise<void> {
    await this.emitToUser(userId, event, data);
  }

  async emitToUser(userId: string, event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  async emitToKitchen(schoolId: string, event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    this.io.to(`school:${schoolId}:kitchen`).emit(event, data);
  }

  async emitToSchool(schoolId: string, event: string, data: unknown): Promise<void> {
    if (!this.io) return;
    this.io.to(`school:${schoolId}:admin`).emit(event, data);
    this.io.to(`school:${schoolId}:kitchen`).emit(event, data);
  }

  async getConnectedUsers(): Promise<string[]> {
    if (!this.io) return [];
    const sockets = await this.io.fetchSockets();
    return sockets
      .map(socket => (socket.data.user?.sub as string | undefined) ?? undefined)
      .filter((userId): userId is string => Boolean(userId));
  }
}

const webSocketServiceInstance = new WebSocketService();
logger.info('WebSocketService initialized');

export const webSocketService = webSocketServiceInstance;
export const _webSocketService = webSocketServiceInstance;
export default webSocketServiceInstance;
