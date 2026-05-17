import { Server as SocketIO } from 'socket.io';

export interface RealtimeEvent<TPayload = unknown> {
  id: string;
  schemaVersion: 'v1';
  type: string;
  schoolId: string;
  room: string;
  aggregateId: string;
  occurredAt: string;
  payload: TPayload;
}

export function broadcastToSchool(
  io: SocketIO | null,
  schoolId: string,
  event: Omit<RealtimeEvent, 'occurredAt'>
): void {
  if (!io) return;
  const fullEvent = { ...event, occurredAt: new Date().toISOString() };
  io.to(`school:${schoolId}:admin`).emit('event', fullEvent);
  io.to(`school:${schoolId}:kitchen`).emit('event', fullEvent);
}

export function broadcastToUser(
  io: SocketIO | null,
  userId: string,
  event: Omit<RealtimeEvent, 'occurredAt'>
): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('event', {
    ...event,
    occurredAt: new Date().toISOString(),
  });
}

export function broadcastToOrder(
  io: SocketIO | null,
  orderId: string,
  event: Omit<RealtimeEvent, 'occurredAt'>
): void {
  if (!io) return;
  io.to(`order:${orderId}`).emit('event', {
    ...event,
    occurredAt: new Date().toISOString(),
  });
}
