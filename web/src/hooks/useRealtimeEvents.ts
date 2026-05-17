'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface RealtimeEvent {
  id: string;
  type: string;
  schoolId: string;
  aggregateId: string;
  occurredAt: string;
  payload: unknown;
}

type EventHandler = (event: RealtimeEvent) => void;

export function useRealtimeEvents(handlers: Record<string, EventHandler>) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<{ disconnect: () => void } | null>(null);
  const cursorRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const params = cursorRef.current ? `?cursor=${encodeURIComponent(cursorRef.current)}` : '';
        const response = await fetch(`/api/v1/realtime/events${params}`, {
          credentials: 'include',
        });
        if (!response.ok) return;

        const body = await response.json();
        const events = body.data?.events ?? [];
        for (const event of events) {
          handlers[event.eventType]?.(event);
        }
        if (body.data?.nextCursor) {
          cursorRef.current = body.data.nextCursor;
        }
      } catch {
        // Polling is a fallback; transient failures should not break the UI.
      }
    }, 10_000);
  }, [handlers]);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const tokenResponse = await fetch('/api/v1/realtime/token', {
          credentials: 'include',
        });
        if (!tokenResponse.ok) throw new Error('Realtime token unavailable');

        const { data } = await tokenResponse.json();
        const { io } = await import('socket.io-client');
        const socket = io({
          path: '/realtime',
          auth: { token: data.token },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => mounted && setConnected(true));
        socket.on('disconnect', () => {
          if (mounted) setConnected(false);
          startPolling();
        });
        socket.on('connect_error', () => {
          if (mounted) setConnected(false);
          startPolling();
        });
        socket.on('event', (event: RealtimeEvent) => {
          handlers[event.type]?.(event);
        });

        socketRef.current = socket;
      } catch {
        startPolling();
      }
    };

    connect();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [handlers, startPolling]);

  return { connected };
}
