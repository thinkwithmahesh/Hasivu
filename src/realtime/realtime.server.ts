import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIO, Socket } from 'socket.io';
import { featureFlags } from '../config/feature-flags';
import { logger } from '../utils/logger';
import { WebSocketService } from '../services/websocket.service';

interface RealtimeToken {
  sub: string;
  schoolId: string;
  role: string;
  rooms: string[];
  jti: string;
}

export function createRealtimeServer(httpServer: HttpServer): SocketIO | null {
  if (!featureFlags.isEnabled('REALTIME_ENABLED')) {
    logger.info('[Realtime] disabled by feature flag');
    WebSocketService.attach(null);
    return null;
  }

  const io = new SocketIO(httpServer, {
    path: '/realtime',
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
      credentials: true,
    },
    maxHttpBufferSize: 16 * 1024,
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token || typeof token !== 'string') {
        next(new Error('AUTH_REQUIRED'));
        return;
      }

      const secret = process.env.REALTIME_TOKEN_SECRET ?? process.env.JWT_SECRET ?? '';
      const decoded = jwt.verify(token, secret) as RealtimeToken;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('AUTH_REQUIRED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as RealtimeToken;
    logger.info('[Realtime] connected', { userId: user.sub, schoolId: user.schoolId });

    const joinedRooms = user.rooms.filter(room => isAuthorizedRoom(room, user));
    joinedRooms.forEach(room => socket.join(room));

    socket.emit('connection.ready.v1', {
      userId: user.sub,
      schoolId: user.schoolId,
      joinedRooms,
    });

    let messageCount = 0;
    const resetInterval = setInterval(() => {
      messageCount = 0;
    }, 1000);

    socket.on('message', () => {
      messageCount += 1;
      if (messageCount > 5) {
        socket.emit('error', { code: 'RATE_LIMITED' });
      }
    });

    socket.on('disconnect', () => {
      clearInterval(resetInterval);
      logger.info('[Realtime] disconnected', { userId: user.sub });
    });
  });

  WebSocketService.attach(io);
  logger.info('[Realtime] server initialized');
  return io;
}

function isAuthorizedRoom(room: string, user: RealtimeToken): boolean {
  const role = user.role.toLowerCase();
  if (room === `school:${user.schoolId}:admin` && ['admin', 'school_admin'].includes(role)) {
    return true;
  }
  if (
    room === `school:${user.schoolId}:kitchen` &&
    ['kitchen_staff', 'kitchen', 'admin', 'school_admin'].includes(role)
  ) {
    return true;
  }
  if (room === `user:${user.sub}`) return true;
  if (room.startsWith('order:') && ['parent', 'kitchen_staff', 'kitchen', 'admin'].includes(role)) {
    return true;
  }
  return false;
}
