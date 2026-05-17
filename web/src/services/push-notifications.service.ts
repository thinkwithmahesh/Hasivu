'use client';

import { usePushNotifications as useMobilePushNotifications } from '@/components/mobile/MobilePushNotifications';

export function usePushNotifications() {
  const notifications = useMobilePushNotifications();

  return {
    ...notifications,
    isRegistered: Boolean(notifications.subscription),
  };
}

export default usePushNotifications;
