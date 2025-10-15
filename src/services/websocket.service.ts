/**
 * WebSocket Service - Stub Implementation
 * TODO: Implement full WebSocket functionality
 */

import { logger } from '../utils/logger';

export class WebSocketService {
  constructor() {
    logger.info('WebSocketService initialized (stub)');
  }

  async broadcast(event: string, data: any): Promise<void> {
    logger.info(`Broadcasting ${event} event`, { data });
  }

  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    logger.info(`Sending ${event} to user ${userId}`, { data });
  }

  async getConnectedUsers(): Promise<string[]> {
    return [];
  }

  // Additional stub methods for kitchen.routes.ts
  async emitToKitchen(schoolId: string, event: string, data: any): Promise<void> {
    logger.info(`Emitting ${event} to kitchen ${schoolId}`, { data });
  }

  async emitToUser(userId: string, event: string, data: any): Promise<void> {
    logger.info(`Emitting ${event} to user ${userId}`, { data });
  }

  async emitToSchool(schoolId: string, event: string, data: any): Promise<void> {
    logger.info(`Emitting ${event} to school ${schoolId}`, { data });
  }
}

const webSocketServiceInstance = new WebSocketService();
export const webSocketService = webSocketServiceInstance;
export const _webSocketService = webSocketServiceInstance;
export default webSocketServiceInstance;
