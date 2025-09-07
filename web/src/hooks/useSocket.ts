"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsManager } from '@/services/api';

export type UseWebSocketOptions = {
  onMessage?: (event: string, data: any) => void;
};

export function useWebSocket(options?: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const onMessageRef = useRef(options?.onMessage);

  useEffect(() => {
    onMessageRef.current = options?.onMessage;
  }, [options?.onMessage]);

  const makeEventHandler = useCallback(
    (eventName: string) => (data: any) => onMessageRef.current?.(eventName, data),
    []
  );

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || undefined : undefined;
      wsManager.connect(token);
    } catch (e) {
      // no-op
    }

    // Subscribe to common schedule events if a handler is provided
    if (onMessageRef.current) {
      wsManager.subscribe('schedule.updated', makeEventHandler('schedule.updated'));
      wsManager.subscribe('schedule.created', makeEventHandler('schedule.created'));
      wsManager.subscribe('schedule.deleted', makeEventHandler('schedule.deleted'));
    }

    const interval = setInterval(() => setIsConnected(wsManager.isConnected()), 1000);
    setIsConnected(wsManager.isConnected());

    return () => {
      if (onMessageRef.current) {
        wsManager.unsubscribe('schedule.updated');
        wsManager.unsubscribe('schedule.created');
        wsManager.unsubscribe('schedule.deleted');
      }
      clearInterval(interval);
    };
  }, [makeEventHandler]);

  const send = useCallback((type: string, data: any) => {
    wsManager.send(type, data);
  }, []);

  return { isConnected, send };
}

export default useWebSocket;
