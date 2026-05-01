'use client';

import { useMemo } from 'react';
import { useRealTimeNotifications as useNotifications } from '@/components/notifications/RealTimeNotifications';

interface RealtimeMessage {
  type: string;
  data: Record<string, any>;
}

export function useRealTimeNotifications() {
  const notifications = useNotifications();

  const lastMessage = useMemo<RealtimeMessage | null>(() => {
    const latest = notifications.notifications[0];
    if (!latest) {
      return null;
    }

    return {
      type: String(latest.type),
      data: (latest.metadata || latest) as Record<string, any>,
    };
  }, [notifications.notifications]);

  return {
    ...notifications,
    lastMessage,
  };
}

export default useRealTimeNotifications;
